// Fairness and supporting metrics for the evaluation (FR-026, SRS §1.3).
// Unless a name says "combined", metrics count NEW simulated placements only, never history.

import type { Mission, School } from "../../src/types/domain";
import { matchStudentsToMission } from "../../src/lib/matching/matching";
import type { Allocation } from "./allocate";
import type { Scenario } from "./generate";

/**
 * Gini coefficient: 0 means everyone has the same, values towards 1 mean a few have most.
 * With values sorted ascending and i = 1..n: G = (2 · Σ i·xᵢ) / (n · Σ xᵢ) − (n + 1) / n.
 */
export function gini(values: number[]): number {
  if (values.some((v) => !Number.isFinite(v) || v < 0)) {
    throw new RangeError("Gini needs finite values of 0 or more.");
  }
  const n = values.length;
  const total = values.reduce((sum, v) => sum + v, 0);
  if (n === 0 || total === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const weighted = sorted.reduce((sum, v, i) => sum + (i + 1) * v, 0);
  return (2 * weighted) / (n * total) - (n + 1) / n;
}

/** Largest minus smallest value. 0 for an empty list. */
export function maxMinGap(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
}

/** Percentage, 0 when the denominator is 0. */
export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : (100 * part) / whole;
}

// ---------------------------------------------------------------------------
// Populations that do not depend on any method's results

export interface Populations {
  /** Per mission: students who meet its school and CGPA criteria, whatever their interest. */
  criteriaEligible: Record<string, string[]>;
  /**
   * Per mission: students who want it and pass the engine's filters at the start,
   * before any allocation (no commitments, historical counts only).
   */
  initialCandidates: Record<string, string[]>;
  /** Students in at least one mission's initial candidate pool: the coverage denominator. */
  initialEligibleInterested: string[];
}

export function populations(scenario: Scenario): Populations {
  const criteriaEligible: Record<string, string[]> = {};
  const initialCandidates: Record<string, string[]> = {};
  const anyMission = new Set<string>();

  for (const mission of scenario.missions) {
    // Only the criteria matter here: availability and commitments are cleared.
    const criteriaOnly = scenario.students.map((s) => ({ ...s, availability: [], commitments: [] }));
    criteriaEligible[mission.id] = sortedIds(matchStudentsToMission(mission, criteriaOnly));

    const interested = new Set(scenario.interest[mission.id]);
    const atStart = scenario.students.filter((s) => interested.has(s.id));
    initialCandidates[mission.id] = sortedIds(matchStudentsToMission(mission, atStart));
    initialCandidates[mission.id].forEach((id) => anyMission.add(id));
  }

  return { criteriaEligible, initialCandidates, initialEligibleInterested: [...anyMission].sort() };
}

function sortedIds(result: ReturnType<typeof matchStudentsToMission>): string[] {
  return result.recommendations.map((r) => r.studentId).sort();
}

export function isGated(mission: Mission): boolean {
  return mission.eligibleSchools.length > 0 || mission.minCgpa !== null;
}

// ---------------------------------------------------------------------------
// Metrics for one allocation

export interface GatedMissionMetrics {
  missionId: string;
  criteria: string;
  slots: number;
  /** Students meeting the school/CGPA criteria, whatever their interest. */
  criteriaEligible: number;
  /** Interested, eligible and available at the start (the same for every method). */
  initialCandidates: number;
  /** Candidate pool when this method allocated the mission (can differ between methods). */
  candidatePoolAtAllocation: number;
  placed: number;
  /** Share of placed students with no history. */
  newVolunteerShareOfPlaced: number;
  /** Share of the initial candidate pool with no history, for comparison. */
  newVolunteerShareOfCandidates: number;
}

export interface Metrics {
  method: Allocation["method"];
  placements: number;
  totalSlots: number;
  slotFillRate: number;
  /** Inequality of new placements across all students. */
  newGini: number;
  newMaxMinGap: number;
  /**
   * Supplementary: inequality of new placements among the common initial eligible-and-interested
   * population only (the same students for every method), leaving out students who never had a chance.
   */
  eligibleGini: number;
  /** Inequality of history plus new placements across all students. */
  combinedGini: number;
  combinedMaxMinGap: number;
  newVolunteers: number;
  newVolunteersIncluded: number;
  newVolunteerInclusionRate: number;
  /** Supplementary: new volunteers (history 0) inside the common eligible-and-interested population. */
  eligibleNewVolunteers: number;
  eligibleNewVolunteersIncluded: number;
  eligibleNewVolunteerInclusionRate: number;
  /** Denominator: initialEligibleInterested, the same for every method. */
  coverageDenominator: number;
  coveredStudents: number;
  coverageRate: number;
  skillMatchedPlacements: number;
  skillMatchedRate: number;
  meanSkillAlignment: number;
  timeConflicts: number;
  /** Mean reliability of placed students; new volunteers count as the neutral 0.5. */
  meanReliabilityOfPlaced: number;
  /** Mean new placements of the 10% of students with the most history. */
  mostExperiencedMeanNew: number;
  meanNewBySchool: Record<School, number>;
  newDistribution: Record<"0" | "1" | "2" | "3+", number>;
  combinedDistribution: Record<"0" | "1–2" | "3–5" | "6+", number>;
  /** Sum of candidate pool sizes over all missions, at allocation time. */
  totalCandidatePool: number;
  gatedMissionShare: number;
  gatedPlacements: number;
  /** Gini of gated placements among students in any gated mission's initial candidate pool. */
  gatedPoolGini: number;
  /** Share of those students who got at least one gated placement. */
  gatedPoolCoverageRate: number;
  gated: GatedMissionMetrics[];
}

export function computeMetrics(scenario: Scenario, allocation: Allocation, pops: Populations): Metrics {
  const ids = scenario.students.map((s) => s.id);
  const byId = new Map(scenario.students.map((s) => [s.id, s]));
  const missionById = new Map(scenario.missions.map((m) => [m.id, m]));
  const newCounts = ids.map((id) => allocation.newCount[id]);
  const combinedCounts = ids.map((id) => scenario.history[id] + allocation.newCount[id]);
  const totalSlots = scenario.missions.reduce((sum, m) => sum + m.capacity, 0);
  const placements = allocation.placements.length;

  // New volunteers: no history before the simulation.
  const newVolunteerIds = ids.filter((id) => scenario.history[id] === 0);
  const newVolunteersIncluded = newVolunteerIds.filter((id) => allocation.newCount[id] > 0).length;

  // Coverage of the common, method-independent eligible-and-interested population.
  const coverageIds = pops.initialEligibleInterested;
  const coveredStudents = coverageIds.filter((id) => allocation.newCount[id] > 0).length;
  const eligibleNewVolunteerIds = coverageIds.filter((id) => scenario.history[id] === 0);
  const eligibleNewVolunteersIncluded = eligibleNewVolunteerIds.filter((id) => allocation.newCount[id] > 0).length;

  // Skills: a placement is skill-matched when the student has at least one required skill.
  let skillMatched = 0;
  let alignmentTotal = 0;
  for (const p of allocation.placements) {
    const mission = missionById.get(p.missionId)!;
    const required = unique(mission.requiredSkills);
    const has = new Set(unique(byId.get(p.studentId)!.skills));
    const matched = required.filter((skill) => has.has(skill)).length;
    if (matched > 0) skillMatched++;
    alignmentTotal += required.length === 0 ? 1 : matched / required.length;
  }

  const reliabilityTotal = allocation.placements.reduce(
    (sum, p) => sum + (byId.get(p.studentId)!.reliability ?? 0.5),
    0,
  );

  const mostExperienced = [...ids]
    .sort((a, b) => scenario.history[b] - scenario.history[a] || (a < b ? -1 : 1))
    .slice(0, Math.ceil(ids.length * 0.1));

  const schools: School[] = ["SBSS", "SEHS", "SCI", "CFGS", "LC"];
  const meanNewBySchool = Object.fromEntries(
    schools.map((school) => {
      const members = ids.filter((id) => byId.get(id)!.school === school);
      return [school, mean(members.map((id) => allocation.newCount[id]))];
    }),
  ) as Record<School, number>;

  const gatedMissions = scenario.missions.filter(isGated);
  const gatedIds = new Set(gatedMissions.map((m) => m.id));
  const gatedPoolIds = [...new Set(gatedMissions.flatMap((m) => pops.initialCandidates[m.id]))].sort();
  const gatedCount: Record<string, number> = Object.fromEntries(gatedPoolIds.map((id) => [id, 0]));
  for (const p of allocation.placements) {
    if (gatedIds.has(p.missionId) && p.studentId in gatedCount) gatedCount[p.studentId]++;
  }

  const gated = gatedMissions.map((mission): GatedMissionMetrics => {
    const placed = allocation.placements.filter((p) => p.missionId === mission.id).map((p) => p.studentId);
    const candidates = pops.initialCandidates[mission.id];
    return {
      missionId: mission.id,
      criteria: describeCriteria(mission),
      slots: mission.capacity,
      criteriaEligible: pops.criteriaEligible[mission.id].length,
      initialCandidates: candidates.length,
      candidatePoolAtAllocation: allocation.candidatePool[mission.id],
      placed: placed.length,
      newVolunteerShareOfPlaced: percent(placed.filter((id) => scenario.history[id] === 0).length, placed.length),
      newVolunteerShareOfCandidates: percent(
        candidates.filter((id) => scenario.history[id] === 0).length,
        candidates.length,
      ),
    };
  });

  return {
    method: allocation.method,
    placements,
    totalSlots,
    slotFillRate: percent(placements, totalSlots),
    newGini: gini(newCounts),
    newMaxMinGap: maxMinGap(newCounts),
    eligibleGini: gini(coverageIds.map((id) => allocation.newCount[id])),
    combinedGini: gini(combinedCounts),
    combinedMaxMinGap: maxMinGap(combinedCounts),
    newVolunteers: newVolunteerIds.length,
    newVolunteersIncluded,
    newVolunteerInclusionRate: percent(newVolunteersIncluded, newVolunteerIds.length),
    eligibleNewVolunteers: eligibleNewVolunteerIds.length,
    eligibleNewVolunteersIncluded,
    eligibleNewVolunteerInclusionRate: percent(eligibleNewVolunteersIncluded, eligibleNewVolunteerIds.length),
    coverageDenominator: coverageIds.length,
    coveredStudents,
    coverageRate: percent(coveredStudents, coverageIds.length),
    skillMatchedPlacements: skillMatched,
    skillMatchedRate: percent(skillMatched, placements),
    meanSkillAlignment: placements === 0 ? 0 : alignmentTotal / placements,
    timeConflicts: countTimeConflicts(allocation, missionById),
    meanReliabilityOfPlaced: placements === 0 ? 0 : reliabilityTotal / placements,
    mostExperiencedMeanNew: mean(mostExperienced.map((id) => allocation.newCount[id])),
    meanNewBySchool,
    newDistribution: {
      "0": newCounts.filter((c) => c === 0).length,
      "1": newCounts.filter((c) => c === 1).length,
      "2": newCounts.filter((c) => c === 2).length,
      "3+": newCounts.filter((c) => c >= 3).length,
    },
    combinedDistribution: {
      "0": combinedCounts.filter((c) => c === 0).length,
      "1–2": combinedCounts.filter((c) => c >= 1 && c <= 2).length,
      "3–5": combinedCounts.filter((c) => c >= 3 && c <= 5).length,
      "6+": combinedCounts.filter((c) => c >= 6).length,
    },
    totalCandidatePool: Object.values(allocation.candidatePool).reduce((sum, n) => sum + n, 0),
    gatedMissionShare: percent(gatedMissions.length, scenario.missions.length),
    gatedPlacements: allocation.placements.filter((p) => gatedIds.has(p.missionId)).length,
    gatedPoolGini: gini(gatedPoolIds.map((id) => gatedCount[id])),
    gatedPoolCoverageRate: percent(gatedPoolIds.filter((id) => gatedCount[id] > 0).length, gatedPoolIds.length),
    gated,
  };
}

/** Pairs of one student's placements whose mission windows overlap. */
export function countTimeConflicts(allocation: Allocation, missionById: Map<string, Mission>): number {
  const windowsByStudent = new Map<string, { start: number; end: number }[]>();
  for (const p of allocation.placements) {
    const w = missionById.get(p.missionId)!.window;
    const list = windowsByStudent.get(p.studentId) ?? [];
    list.push({ start: Date.parse(w.start), end: Date.parse(w.end) });
    windowsByStudent.set(p.studentId, list);
  }
  let conflicts = 0;
  for (const list of windowsByStudent.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[i].start < list[j].end && list[j].start < list[i].end) conflicts++;
      }
    }
  }
  return conflicts;
}

function describeCriteria(mission: Mission): string {
  const parts: string[] = [];
  if (mission.eligibleSchools.length > 0) parts.push(mission.eligibleSchools.join("/"));
  if (mission.minCgpa !== null) parts.push(`CGPA ≥ ${mission.minCgpa.toFixed(2)}`);
  if (mission.deanApprovalRequired) parts.push("dean approval");
  return parts.join(", ");
}

function unique(skills: string[]): string[] {
  return [...new Set(skills.map((s) => s.trim().toLowerCase()).filter((s) => s !== ""))];
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
}
