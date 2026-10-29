import { describe, expect, it } from "vitest";
import type { Mission, Student } from "../../src/types/domain";
import { BASE_WEIGHTS, matchStudentsToMission } from "../../src/lib/matching/matching";
import { METHODS, allocate, missionsInOrder } from "./allocate";
import { applyConfiguration, generateScenario, type Scenario } from "./generate";
import { countTimeConflicts, populations } from "./metrics";

const at = (day: number, time: string) => `2026-11-0${day}T${time}:00+08:00`;
function student(id: string, overrides: Partial<Student> = {}): Student {
  return {
    id,
    displayName: id,
    skills: ["first aid"],
    availability: [],
    matchingOptOut: false,
    school: "SCI",
    cgpa: 3.5,
    recentOpportunities: 0,
    reliability: null,
    commitments: [],
    ...overrides,
  };
}
function mission(id: string, day: number, start: string, end: string, overrides: Partial<Mission> = {}): Mission {
  return {
    id,
    organizationId: "org",
    title: id,
    requiredSkills: ["first aid"],
    window: { start: at(day, start), end: at(day, end) },
    capacity: 1,
    acceptedCount: 0,
    status: "PUBLISHED",
    source: "manual",
    eligibleSchools: [],
    minCgpa: null,
    deanApprovalRequired: false,
    ...overrides,
  };
}
function scenarioOf(students: Student[], missions: Mission[], arrival: string[]): Scenario {
  const ids = students.map((s) => s.id);
  return {
    seed: 1,
    configuration: "future",
    options: { students: ids.length, missions: missions.length, interestProbability: 1, gatedMissions: 0, history: "skewed" },
    students,
    missions,
    history: Object.fromEntries(students.map((s) => [s.id, s.recentOpportunities])),
    interest: Object.fromEntries(missions.map((m) => [m.id, ids])),
    arrivalRandom: Object.fromEntries(missions.map((m) => [m.id, arrival])),
    arrivalEngaged: Object.fromEntries(missions.map((m) => [m.id, [...arrival].reverse()])),
  };
}

describe("allocate: simple cases", () => {
  it("FCFS follows arrival order exactly; Voluntree follows the engine's ranking", () => {
    const students = [
      student("veteran", { recentOpportunities: 6, reliability: 0.9 }),
      student("newcomer"),
      student("middle", { recentOpportunities: 2, reliability: 0.8 }),
    ];
    const s = scenarioOf(students, [mission("m1", 3, "09:00", "11:00", { capacity: 2 })], ["veteran", "middle", "newcomer"]);
    expect(allocate(s, "fcfs-random").placements.map((p) => p.studentId)).toEqual(["veteran", "middle"]);
    expect(allocate(s, "fcfs-engaged").placements.map((p) => p.studentId)).toEqual(["newcomer", "middle"]);
    const engineOrder = matchStudentsToMission(s.missions[0], students).recommendations.map((r) => r.studentId);
    expect(allocate(s, "voluntree").placements.map((p) => p.studentId)).toEqual(engineOrder.slice(0, 2));
    expect(engineOrder[0]).toBe("newcomer");
  });

  it("counts an approval only after the mission ends, so it lowers the student's rank for later missions", () => {
    // a and b are identical; ID order puts a first on m1. After m1 ends, a has 1 approval, so b ranks first on m2.
    const students = [student("a"), student("b")];
    const s = scenarioOf(
      students,
      [mission("m1", 3, "09:00", "11:00"), mission("m2", 3, "11:00", "13:00")],
      ["a", "b"],
    );
    const v = allocate(s, "voluntree").placements;
    expect(v).toEqual([
      { missionId: "m1", studentId: "a" },
      { missionId: "m2", studentId: "b" },
    ]);
    // FCFS ignores history, so the earliest arrival gets both.
    expect(allocate(s, "fcfs-random").placements.map((p) => p.studentId)).toEqual(["a", "a"]);
  });

  it("adds a commitment immediately, so an overlapping mission is blocked", () => {
    const s = scenarioOf([student("a"), student("b")], [
      mission("m1", 3, "09:00", "12:00"),
      mission("m2", 3, "11:00", "13:00"),
    ], ["a", "b"]);
    for (const method of METHODS) {
      const placements = allocate(s, method).placements;
      expect(placements.filter((p) => p.studentId === "a")).toHaveLength(1);
    }
  });

  it("never places ineligible or unavailable students, but does place unknown availability", () => {
    const students = [
      student("lc", { school: "LC" }),
      student("busy", { availability: [{ start: at(3, "13:00"), end: at(3, "18:00") }] }),
      student("unknown", { availability: [] }),
    ];
    const s = scenarioOf(students, [mission("m1", 3, "09:00", "11:00", { capacity: 3, eligibleSchools: ["SCI"] })], [
      "lc",
      "busy",
      "unknown",
    ]);
    for (const method of METHODS) {
      expect(allocate(s, method).placements.map((p) => p.studentId)).toEqual(["unknown"]);
    }
  });

  it("only places interested students", () => {
    const s = scenarioOf([student("a"), student("b")], [mission("m1", 3, "09:00", "11:00", { capacity: 2 })], ["a", "b"]);
    s.interest.m1 = ["b"];
    for (const method of METHODS) {
      expect(allocate(s, method).placements.map((p) => p.studentId)).toEqual(["b"]);
    }
  });

  it("allocates missions by start time, then ID", () => {
    const missions = [mission("m3", 4, "09:00", "11:00"), mission("m2", 3, "10:00", "12:00"), mission("m1", 3, "10:00", "11:00")];
    expect(missionsInOrder(missions).map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });
});

describe.each(["future", "live"] as const)("allocate: generated scenario (%s configuration)", (configuration) => {
  const scenario = applyConfiguration(generateScenario(20261028), configuration);
  const pops = populations(scenario);
  const missionById = new Map(scenario.missions.map((m) => [m.id, m]));

  it.each(METHODS)("%s respects capacity, interest, eligibility and time conflicts", (method) => {
    const result = allocate(scenario, method);
    for (const m of scenario.missions) {
      const placed = result.placements.filter((p) => p.missionId === m.id).map((p) => p.studentId);
      expect(placed.length).toBeLessThanOrEqual(m.capacity);
      expect(new Set(placed).size).toBe(placed.length);
      // Everyone placed was in the mission's initial candidate pool (interested, eligible, available).
      expect(placed.every((id) => pops.initialCandidates[m.id].includes(id))).toBe(true);
    }
    expect(countTimeConflicts(result, missionById)).toBe(0);
    const total = Object.values(result.newCount).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(result.placements.length);
  });

  it("gives every method the same candidate pool for the first mission", () => {
    const first = missionsInOrder(scenario.missions)[0].id;
    const pools = METHODS.map((method) => allocate(scenario, method).candidatePool[first]);
    expect(new Set(pools).size).toBe(1);
    expect(pools[0]).toBe(pops.initialCandidates[first].length);
  });

  it("is deterministic and does not change the scenario or its history", () => {
    const before = structuredClone(scenario);
    for (const method of METHODS) {
      expect(allocate(scenario, method)).toEqual(allocate(scenario, method));
    }
    expect(scenario).toEqual(before);
  });

  it("ranks Voluntree's live pools by fewest approved participations (reliability is constant)", () => {
    if (configuration !== "live") return;
    const first = missionsInOrder(scenario.missions)[0];
    const pool = matchStudentsToMission(first, scenario.students.filter((s) => scenario.interest[first.id].includes(s.id)));
    const history = pool.recommendations.map((r) => scenario.history[r.studentId]);
    expect(history).toEqual([...history].sort((a, b) => a - b));
  });

  it("uses the unchanged DEC-036 base weights from the matching engine", () => {
    expect(BASE_WEIGHTS).toEqual({ skill: 35, opportunityBalance: 20, proximity: 10, reliability: 5 });
  });
});
