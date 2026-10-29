// Synthetic scenario for the baseline evaluation (FR-026). Synthetic data only (AGENTS.md rule 10).
//
// Every random draw happens in a fixed order with a fixed number of draws per student and
// per mission, so the "equal history" variant gets exactly the same students, missions,
// interest and arrival times; only the starting history changes.

import type { Mission, School, Student } from "../../src/types/domain";
import { matchStudentsToMission } from "../../src/lib/matching/matching";
import { createRandom } from "./random";

export const SKILLS = [
  "first aid",
  "tutoring",
  "registration desk",
  "social media",
  "event setup",
  "logistics",
  "photography",
  "translation",
] as const;

/** Percentages of students per school (synthetic assumption). */
export const SCHOOL_SHARES: [School, number][] = [
  ["SBSS", 25],
  ["SEHS", 20],
  ["SCI", 25],
  ["CFGS", 15],
  ["LC", 15],
];

/** Mission days: 2 to 6 November 2026, four missions per day. */
export const MISSION_DAYS = [2, 3, 4, 5, 6];

/**
 * FCFS-engaged sensitivity check: each past participation moves a student's arrival
 * slightly earlier, by 0.05 on a 0–1 random arrival score, capped at 0.25 (5 participations).
 */
export const ENGAGED_BONUS_PER_PARTICIPATION = 0.05;
export const ENGAGED_BONUS_CAP = 0.25;

export interface ScenarioOptions {
  students: number;
  missions: number;
  /** Chance that a student wants a given mission. */
  interestProbability: number;
  gatedMissions: number;
  /** "skewed": the uneven starting history below. "equal": everyone starts at 0. */
  history: "skewed" | "equal";
}

export const DEFAULT_OPTIONS: ScenarioOptions = {
  students: 100,
  missions: 20,
  interestProbability: 0.35,
  gatedMissions: 5,
  history: "skewed",
};

/**
 * "future": students declare skills and availability, missions list required skills (the
 * original Task 4 simulation). "live": the app as it runs now (DEC-048): no declared skills,
 * no declared availability and no reliability data. See applyConfiguration.
 */
export type Configuration = "live" | "future";

export interface Scenario {
  seed: number;
  configuration: Configuration;
  options: ScenarioOptions;
  /** recentOpportunities holds the historical count; commitments start empty. */
  students: Student[];
  missions: Mission[];
  /** Historical approved participations before the simulation. Never changed. */
  history: Record<string, number>;
  /** For each mission, the IDs of students who want it. Shared by every method. */
  interest: Record<string, string[]>;
  /** For each mission, every student's arrival order under FCFS-random (earliest first). */
  arrivalRandom: Record<string, string[]>;
  /** The same arrival scores plus the small, capped engaged bonus (sensitivity only). */
  arrivalEngaged: Record<string, string[]>;
}

export function generateScenario(seed: number, overrides: Partial<ScenarioOptions> = {}): Scenario {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  if (options.missions > MISSION_DAYS.length * 4) {
    throw new RangeError(`At most ${MISSION_DAYS.length * 4} missions are supported.`);
  }
  if (options.gatedMissions > options.missions) {
    throw new RangeError("gatedMissions cannot exceed missions.");
  }
  const random = createRandom(seed);
  const pad = (n: number, width: number) => String(n).padStart(width, "0");

  // --- Students -------------------------------------------------------------
  const students: Student[] = [];
  const history: Record<string, number> = {};
  for (let i = 1; i <= options.students; i++) {
    const id = `s${pad(i, 3)}`;

    const schoolRoll = random.next() * 100;
    let cumulative = 0;
    let school: School = SCHOOL_SHARES[SCHOOL_SHARES.length - 1][0];
    for (const [name, share] of SCHOOL_SHARES) {
      cumulative += share;
      if (schoolRoll < cumulative) {
        school = name;
        break;
      }
    }

    const noCgpa = random.chance(0.1);
    const cgpaValue = random.decimal(2, 4, 2);

    const skillCount = random.int(1, 3);
    const skills = random.shuffle(SKILLS).slice(0, skillCount);

    // Uneven history: 40% none, 30% 1–2, 20% 3–5, 10% 6–12.
    const bucket = random.next();
    const low = random.int(1, 2);
    const mid = random.int(3, 5);
    const high = random.int(6, 12);
    const skewed = bucket < 0.4 ? 0 : bucket < 0.7 ? low : bucket < 0.9 ? mid : high;
    const past = options.history === "equal" ? 0 : skewed;
    const reliabilityValue = random.decimal(0.6, 1, 2);

    // 15% never entered availability; the rest declare 2–4 of the 5 days, one window per day.
    const emptyAvailability = random.chance(0.15);
    const dayCount = random.int(2, 4);
    const days = random.shuffle(MISSION_DAYS);
    const windows = MISSION_DAYS.map(() => ({ start: random.int(8, 12), end: random.int(13, 18) }));
    const availability = emptyAvailability
      ? []
      : days
          .slice(0, dayCount)
          .sort((a, b) => a - b)
          .map((day) => {
            const w = windows[MISSION_DAYS.indexOf(day)];
            return { start: isoTime(day, w.start), end: isoTime(day, w.end) };
          });

    history[id] = past;
    students.push({
      id,
      displayName: `Synthetic student ${pad(i, 3)}`,
      skills,
      availability,
      matchingOptOut: false,
      school,
      cgpa: noCgpa ? null : cgpaValue,
      recentOpportunities: past,
      // New students have no reliability history (cold start).
      reliability: past === 0 ? null : reliabilityValue,
      commitments: [],
    });
  }

  // --- Missions -------------------------------------------------------------
  const missions: Mission[] = [];
  for (let i = 0; i < options.missions; i++) {
    const day = MISSION_DAYS[Math.floor(i / 4)];
    const duration = random.int(2, 4);
    const start = Math.min(random.int(8, 14), 18 - duration);
    const skillCount = random.int(1, 2);
    const requiredSkills = random.shuffle(SKILLS).slice(0, skillCount);
    const capacity = random.int(3, 8);
    missions.push({
      id: `m${pad(i + 1, 2)}`,
      organizationId: "org-synthetic",
      title: `Synthetic mission ${pad(i + 1, 2)}`,
      requiredSkills,
      window: { start: isoTime(day, start), end: isoTime(day, start + duration) },
      capacity,
      acceptedCount: 0,
      status: "PUBLISHED",
      source: "manual",
      eligibleSchools: [],
      minCgpa: null,
      deanApprovalRequired: false,
    });
  }

  // Gated missions: schools only, minimum CGPA only, or both. The first two also need the dean.
  const gatedIndexes = random.shuffle(missions.map((_, i) => i)).slice(0, options.gatedMissions);
  gatedIndexes.forEach((index, n) => {
    const kind = random.int(0, 2); // 0 = schools, 1 = CGPA, 2 = both
    const schoolCount = random.int(1, 2);
    const schools = random.shuffle(SCHOOL_SHARES.map(([name]) => name)).slice(0, schoolCount);
    const mission = missions[index];
    mission.eligibleSchools = kind === 1 ? [] : schools.sort();
    mission.minCgpa = kind === 0 ? null : 3.0;
    mission.deanApprovalRequired = n < 2;
  });

  // --- Interest and arrival order -------------------------------------------
  const interest: Record<string, string[]> = {};
  const arrivalRandom: Record<string, string[]> = {};
  const arrivalEngaged: Record<string, string[]> = {};
  for (const mission of missions) {
    interest[mission.id] = students
      .filter(() => random.chance(options.interestProbability))
      .map((s) => s.id);
  }
  for (const mission of missions) {
    const scores = students.map((s) => ({ id: s.id, score: random.next() }));
    arrivalRandom[mission.id] = byScoreDescending(scores);
    arrivalEngaged[mission.id] = byScoreDescending(
      scores.map(({ id, score }) => ({
        id,
        score: score + Math.min(history[id] * ENGAGED_BONUS_PER_PARTICIPATION, ENGAGED_BONUS_CAP),
      })),
    );
  }

  return { seed, configuration: "future", options, students, missions, history, interest, arrivalRandom, arrivalEngaged };
}

/**
 * The same generated scenario under one configuration. "future" returns it unchanged.
 * "live" returns a copy that matches what the app passes to matching today:
 * - every mission lists no required skills, so the skill factor is left out;
 * - every student has availability [] (DEC-048), so matching excludes no one for availability;
 * - every student has reliability null, so everyone gets the neutral 0.5 (no reliability data yet).
 * Students still accept only missions they can attend (DEC-048). That is modelled as
 * self-selection, not as a matching filter: a student stays interested in a mission only if their
 * generated windows cover it (or they never entered any, which counts as free). The test is the
 * matching engine's own availability rule, so it is the same rule the future configuration uses.
 * Students, missions, history, school, CGPA, capacity and arrival orders are otherwise unchanged.
 */
export function applyConfiguration(scenario: Scenario, configuration: Configuration): Scenario {
  if (configuration === "future") return scenario;

  const byId = new Map(scenario.students.map((s) => [s.id, s]));
  const interest: Record<string, string[]> = {};
  for (const mission of scenario.missions) {
    const open = { ...mission, acceptedCount: 0, eligibleSchools: [], minCgpa: null };
    interest[mission.id] = scenario.interest[mission.id].filter((id) => {
      const student = { ...byId.get(id)!, commitments: [], matchingOptOut: false };
      const { exclusions } = matchStudentsToMission(open, [student]);
      return !exclusions.some((e) => e.reasons.includes("NOT_AVAILABLE"));
    });
  }

  return {
    ...scenario,
    configuration: "live",
    missions: scenario.missions.map((m) => ({ ...m, requiredSkills: [] })),
    students: scenario.students.map((s) => ({ ...s, availability: [], reliability: null })),
    interest,
  };
}

/** "2026-11-03T09:00:00+08:00" for day 3, hour 9 (AIU local time). */
function isoTime(day: number, hour: number): string {
  return `2026-11-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00+08:00`;
}

/** Highest score arrives first; equal scores fall back to the student ID. */
function byScoreDescending(scores: { id: string; score: number }[]): string[] {
  return [...scores]
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((s) => s.id);
}
