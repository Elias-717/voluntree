// Volunteer matching (FR-007, FR-024, FR-025, FR-029, BR-02, BR-15, NFR-09; SRS §10; DEC-036).
// Stage 1 removes students who must not be recommended, and records every reason.
// Stage 2 ranks the rest with a transparent weighted score and a "Why recommended" line per factor.
//
// Matching is advisory. accept_mission in the database stays the final check at acceptance.
// CGPA and school are read only in Stage 1, never in the score (BR-15).
// Availability is a Stage 1 filter only, never in the score (DEC-036).
// No clock and no randomness: the same input always gives the same output.

import type {
  Commitment,
  ExclusionReason,
  Factor,
  FactorName,
  MatchResult,
  Mission,
  Recommendation,
  Student,
  TimeWindow,
} from "@/types/domain";

/** Starting weights from SRS §10 (DEC-036). Each is divided by the total of the factors that apply. */
export const BASE_WEIGHTS: Record<FactorName, number> = {
  skill: 35,
  opportunityBalance: 20,
  proximity: 10,
  reliability: 5,
};

/** Reliability used for new students with no history (cold start, FR-024). */
export const NEUTRAL_RELIABILITY = 0.5;

export const ALGORITHM_VERSION = "matching-v1";

/** Scores are compared at this many decimals, so floating-point noise cannot change the order. */
const RANKING_DECIMALS = 6;

/** Assignment statuses that hold the student's time, the same as accept_mission. */
const HOLDS_TIME: Commitment["status"][] = ["PENDING_DEAN_APPROVAL", "ACCEPTED"];

const MIN_CGPA = 0;
const MAX_CGPA = 4;

/** Organizer view: ranks every student for one mission and lists who was excluded and why. */
export function matchStudentsToMission(mission: Mission, students: Student[]): MatchResult {
  checkMission(mission);
  if (mission.status !== "PUBLISHED") {
    throw new RangeError(
      `Only PUBLISHED missions can be matched. Mission ${mission.id} is ${mission.status}.`,
    );
  }
  checkUniqueIds(students.map((s) => s.id), "student");

  const recommendations: Recommendation[] = [];
  const exclusions: MatchResult["exclusions"] = [];
  for (const student of students) {
    checkStudent(student);
    const reasons = findExclusionReasons(mission, student);
    if (reasons.length > 0) {
      exclusions.push({ studentId: student.id, reasons });
    } else {
      recommendations.push(scoreStudent(mission, student));
    }
  }

  recommendations.sort((a, b) => compareRanked(a, b, a.studentId, b.studentId));
  exclusions.sort((a, b) => compareIds(a.studentId, b.studentId));
  return { recommendations, exclusions };
}

/**
 * Student view (GET /missions/recommended): ranks the missions this student may be recommended.
 * Non-published missions and missions the student is excluded from are hidden (FR-029).
 */
export function recommendMissionsForStudent(student: Student, missions: Mission[]): Recommendation[] {
  checkStudent(student);
  checkUniqueIds(missions.map((m) => m.id), "mission");

  const recommendations: Recommendation[] = [];
  for (const mission of missions) {
    checkMission(mission);
    if (mission.status !== "PUBLISHED") continue;
    if (findExclusionReasons(mission, student).length > 0) continue;
    recommendations.push(scoreStudent(mission, student));
  }

  recommendations.sort((a, b) => compareRanked(a, b, a.missionId, b.missionId));
  return recommendations;
}

// ---------------------------------------------------------------------------
// Stage 1: hard filters. Reasons are listed in the same order as ExclusionReason.

function findExclusionReasons(mission: Mission, student: Student): ExclusionReason[] {
  const reasons: ExclusionReason[] = [];

  // Any assignment for this mission, in any status. A dean rejection is final (DEC-036).
  if (student.commitments.some((c) => c.missionId === mission.id)) {
    reasons.push("ALREADY_ASSIGNED");
  }

  // Only pending and accepted assignments on other missions hold the student's time.
  const conflict = student.commitments.some(
    (c) =>
      c.missionId !== mission.id &&
      HOLDS_TIME.includes(c.status) &&
      overlaps(c.window, mission.window),
  );
  if (conflict) reasons.push("TIME_CONFLICT");

  // Empty availability means "unknown" and is not excluded.
  if (availabilityFor(student, mission) === "NOT_COVERED") reasons.push("NOT_AVAILABLE");

  if (mission.eligibleSchools.length > 0 && !mission.eligibleSchools.includes(student.school)) {
    reasons.push("SCHOOL_NOT_ELIGIBLE");
  }

  // No declared CGPA fails a set minimum. A CGPA equal to the minimum passes.
  if (mission.minCgpa !== null && (student.cgpa === null || student.cgpa < mission.minCgpa)) {
    reasons.push("CGPA_BELOW_MINIMUM");
  }

  if (student.matchingOptOut) reasons.push("OPTED_OUT");

  // acceptedCount already includes pending dean approvals (FR-030).
  if (mission.acceptedCount >= mission.capacity) reasons.push("MISSION_FULL");

  return reasons;
}

/**
 * "FULL" when the declared windows, joined where they overlap or touch, cover the whole mission.
 * "UNKNOWN" when no availability is declared. "NOT_COVERED" otherwise.
 */
function availabilityFor(student: Student, mission: Mission): "FULL" | "UNKNOWN" | "NOT_COVERED" {
  if (student.availability.length === 0) return "UNKNOWN";

  const missionStart = toMs(mission.window.start);
  const missionEnd = toMs(mission.window.end);
  const windows = student.availability
    .map((w) => ({ start: toMs(w.start), end: toMs(w.end) }))
    .sort((a, b) => a.start - b.start);

  // Walk through the windows in time order, joining each one that overlaps or touches the current stretch.
  let stretch = windows[0];
  for (const next of windows.slice(1)) {
    if (next.start <= stretch.end) {
      stretch = { start: stretch.start, end: Math.max(stretch.end, next.end) };
    } else {
      if (stretch.start <= missionStart && stretch.end >= missionEnd) return "FULL";
      stretch = next;
    }
  }
  return stretch.start <= missionStart && stretch.end >= missionEnd ? "FULL" : "NOT_COVERED";
}

/** True when the windows share time. Windows that only touch (one ends as the other starts) do not. */
function overlaps(a: TimeWindow, b: TimeWindow): boolean {
  return toMs(a.start) < toMs(b.end) && toMs(b.start) < toMs(a.end);
}

// ---------------------------------------------------------------------------
// Stage 2: transparent weighted score. Never reads CGPA, school or availability.

function scoreStudent(mission: Mission, student: Student): Recommendation {
  const applicable: { name: FactorName; value: number; explanation: string }[] = [];

  const requiredSkills = uniqueSkills(mission.requiredSkills);
  if (requiredSkills.length > 0) {
    const studentSkills = new Set(uniqueSkills(student.skills));
    const matched = requiredSkills.filter((skill) => studentSkills.has(skill)).length;
    applicable.push({
      name: "skill",
      value: matched / requiredSkills.length,
      explanation: `Has ${matched} of ${requiredSkills.length} required skill${requiredSkills.length === 1 ? "" : "s"}`,
    });
  }

  // Fewer approved participations (all time) gives a higher value: 0 → 1, 1 → 0.5, 3 → 0.25.
  const past = student.recentOpportunities;
  applicable.push({
    name: "opportunityBalance",
    value: 1 / (1 + past),
    explanation:
      past === 0
        ? "No approved participations yet: highest priority for fair access"
        : `${past} approved participation${past === 1 ? "" : "s"} so far: fewer means higher priority`,
  });

  if (student.proximity !== undefined) {
    applicable.push({
      name: "proximity",
      value: student.proximity,
      explanation: `Coarse proximity: ${Math.round(student.proximity * 100)}%`,
    });
  }

  applicable.push({
    name: "reliability",
    value: student.reliability ?? NEUTRAL_RELIABILITY,
    explanation:
      student.reliability === null
        ? "New volunteer: neutral reliability (cold start)"
        : `Reliability: ${Math.round(student.reliability * 100)}%`,
  });

  // Factors that do not apply are left out, and the remaining weights are scaled to add up to 1.
  const totalBase = applicable.reduce((sum, f) => sum + BASE_WEIGHTS[f.name], 0);
  const factors: Factor[] = applicable.map((f) => {
    const weight = BASE_WEIGHTS[f.name] / totalBase;
    return { name: f.name, weight, value: f.value, contribution: weight * f.value, explanation: f.explanation };
  });
  const score = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    missionId: mission.id,
    studentId: student.id,
    score,
    factors,
    availability: availabilityFor(student, mission) === "FULL" ? "FULL" : "UNKNOWN",
    algorithmVersion: ALGORITHM_VERSION,
  };
}

/** Lowercase, trimmed, without blanks or duplicates, so "First Aid " matches "first aid". */
function uniqueSkills(skills: string[]): string[] {
  return [...new Set(skills.map((s) => s.trim().toLowerCase()).filter((s) => s !== ""))];
}

// ---------------------------------------------------------------------------
// Ranking: highest score first (compared at 6 decimals), then by ID.

function compareRanked(a: Recommendation, b: Recommendation, idA: string, idB: string): number {
  const scoreA = roundForRanking(a.score);
  const scoreB = roundForRanking(b.score);
  if (scoreA !== scoreB) return scoreB - scoreA;
  return compareIds(idA, idB);
}

function roundForRanking(score: number): number {
  const factor = 10 ** RANKING_DECIMALS;
  return Math.round(score * factor) / factor;
}

/** Plain character-code order, the same on every machine (no locale rules). */
function compareIds(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Input checks. Bad data throws a RangeError instead of being silently fixed.

function checkMission(mission: Mission): void {
  const label = `Mission ${mission.id}`;
  checkWindow(mission.window, `${label} window`);
  checkWholeNumber(mission.capacity, `${label} capacity`);
  checkWholeNumber(mission.acceptedCount, `${label} acceptedCount`);
  if (mission.minCgpa !== null) checkRange(mission.minCgpa, MIN_CGPA, MAX_CGPA, `${label} minCgpa`);
}

function checkStudent(student: Student): void {
  const label = `Student ${student.id}`;
  student.availability.forEach((w, i) => checkWindow(w, `${label} availability[${i}]`));
  student.commitments.forEach((c, i) => checkWindow(c.window, `${label} commitments[${i}] window`));
  checkWholeNumber(student.recentOpportunities, `${label} recentOpportunities`);
  if (student.cgpa !== null) checkRange(student.cgpa, MIN_CGPA, MAX_CGPA, `${label} cgpa`);
  if (student.reliability !== null) checkRange(student.reliability, 0, 1, `${label} reliability`);
  if (student.proximity !== undefined) checkRange(student.proximity, 0, 1, `${label} proximity`);
}

function checkUniqueIds(ids: string[], kind: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new RangeError(`Duplicate ${kind} ID: ${id}`);
    seen.add(id);
  }
}

function checkWindow(window: TimeWindow, label: string): void {
  if (toMs(window.end) <= toMs(window.start)) {
    throw new RangeError(`${label} must end after it starts: ${window.start} to ${window.end}`);
  }
}

function checkWholeNumber(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a whole number, 0 or more. Received: ${value}`);
  }
}

function checkRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}. Received: ${value}`);
  }
}

// ISO 8601 date and time with a time zone, e.g. "2026-11-03T09:00:00+08:00" or "...Z".
// Groups: year, month, day, hour, minute, second, then the offset's hours and minutes (absent for Z).
const ISO_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):(\d{2}))$/;

/** Real time zones run from -12:00 to +14:00, so an offset may be at most 14 hours. */
const MAX_OFFSET_MINUTES = 14 * 60;

/**
 * Milliseconds since 1970 for an ISO time. Rejects impossible dates such as 2026-02-30,
 * which JavaScript's Date would otherwise roll over to 2 March, and impossible time zone
 * offsets such as +25:00 or +08:99, for which Date.parse would return NaN.
 */
function toMs(value: string): number {
  const match = ISO_DATE_TIME.exec(value);
  if (match) {
    const [year, month, day, hour, minute, second, offsetHours, offsetMinutes] = match
      .slice(1, 9)
      .map((part) => Number(part ?? 0));
    const calendar = new Date(Date.UTC(year, month - 1, day));
    const realDay =
      calendar.getUTCFullYear() === year &&
      calendar.getUTCMonth() === month - 1 &&
      calendar.getUTCDate() === day;
    const realTime = hour <= 23 && minute <= 59 && second <= 59;
    const realOffset = offsetMinutes <= 59 && offsetHours * 60 + offsetMinutes <= MAX_OFFSET_MINUTES;
    const ms = Date.parse(value);
    if (realDay && realTime && realOffset && Number.isFinite(ms)) {
      return ms;
    }
  }
  throw new RangeError(`Not a valid ISO date-time with a time zone: ${value}`);
}
