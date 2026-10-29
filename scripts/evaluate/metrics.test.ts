import { describe, expect, it } from "vitest";
import type { Mission, Student } from "../../src/types/domain";
import type { Allocation } from "./allocate";
import type { Scenario } from "./generate";
import { computeMetrics, countTimeConflicts, gini, maxMinGap, percent, populations } from "./metrics";

describe("gini", () => {
  it.each([
    [[0, 0, 0], 0],
    [[2, 2, 2], 0],
    [[0, 0, 0, 4], 0.75],
    [[1, 2, 3, 4], 0.25],
    [[5], 0],
    [[], 0],
  ])("gini(%j) = %d", (values, expected) => {
    expect(gini(values)).toBeCloseTo(expected, 12);
  });

  it("does not depend on the order of the values", () => {
    expect(gini([4, 0, 3, 1])).toBeCloseTo(gini([0, 1, 3, 4]), 12);
  });

  it("rejects negative or non-finite values", () => {
    expect(() => gini([1, -1])).toThrow(RangeError);
    expect(() => gini([1, NaN])).toThrow(RangeError);
  });
});

describe("maxMinGap and percent", () => {
  it("computes the gap", () => {
    expect(maxMinGap([3, 0, 7, 2])).toBe(7);
    expect(maxMinGap([])).toBe(0);
  });

  it("computes percentages, with 0 for an empty denominator", () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(0, 0)).toBe(0);
  });
});

// A tiny hand-made scenario: 4 students, 2 missions on 3 Nov (+08:00).
const at = (time: string) => `2026-11-03T${time}:00+08:00`;
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
function mission(id: string, start: string, end: string, overrides: Partial<Mission> = {}): Mission {
  return {
    id,
    organizationId: "org",
    title: id,
    requiredSkills: ["first aid"],
    window: { start: at(start), end: at(end) },
    capacity: 2,
    acceptedCount: 0,
    status: "PUBLISHED",
    source: "manual",
    eligibleSchools: [],
    minCgpa: null,
    deanApprovalRequired: false,
    ...overrides,
  };
}

const students = [
  student("a"),
  student("b", { recentOpportunities: 3, reliability: 0.9, skills: ["tutoring"] }),
  student("c", { school: "LC" }),
  student("d"), // wants nothing
];
const scenario: Scenario = {
  seed: 1,
  configuration: "future",
  options: { students: 4, missions: 2, interestProbability: 1, gatedMissions: 1, history: "skewed" },
  students,
  missions: [mission("m1", "09:00", "11:00"), mission("m2", "10:00", "12:00", { eligibleSchools: ["SCI"] })],
  history: { a: 0, b: 3, c: 0, d: 0 },
  interest: { m1: ["a", "b", "c"], m2: ["a", "b", "c"] },
  arrivalRandom: { m1: ["a", "b", "c", "d"], m2: ["a", "b", "c", "d"] },
  arrivalEngaged: { m1: ["a", "b", "c", "d"], m2: ["a", "b", "c", "d"] },
};

describe("populations (method-independent)", () => {
  const pops = populations(scenario);

  it("separates criteria-eligible students from the interested-and-eligible candidates", () => {
    expect(pops.criteriaEligible.m2).toEqual(["a", "b", "d"]); // c is LC
    expect(pops.initialCandidates.m2).toEqual(["a", "b"]); // d is not interested
    expect(pops.initialCandidates.m1).toEqual(["a", "b", "c"]);
  });

  it("uses the union of initial candidate pools as the coverage denominator", () => {
    expect(pops.initialEligibleInterested).toEqual(["a", "b", "c"]);
  });
});

describe("computeMetrics", () => {
  const pops = populations(scenario);
  // A deliberately conflicting allocation, to check the conflict counter.
  const allocation: Allocation = {
    method: "fcfs-random",
    placements: [
      { missionId: "m1", studentId: "a" },
      { missionId: "m1", studentId: "b" },
      { missionId: "m2", studentId: "a" },
    ],
    newCount: { a: 2, b: 1, c: 0, d: 0 },
    candidatePool: { m1: 3, m2: 1 },
  };
  const m = computeMetrics(scenario, allocation, pops);

  it("counts new placements separately from history", () => {
    expect(m.placements).toBe(3);
    expect(m.newGini).toBeCloseTo(gini([2, 1, 0, 0]), 12);
    expect(m.combinedGini).toBeCloseTo(gini([2, 4, 0, 0]), 12);
    expect(m.newMaxMinGap).toBe(2);
    expect(m.combinedMaxMinGap).toBe(4);
  });

  it("measures new-volunteer inclusion and coverage against fixed denominators", () => {
    expect(m.newVolunteers).toBe(3); // a, c, d
    expect(m.newVolunteersIncluded).toBe(1); // a
    expect(m.coverageDenominator).toBe(3);
    expect(m.coveredStudents).toBe(2); // a, b
    expect(m.coverageRate).toBeCloseTo(200 / 3, 12);
  });

  it("computes the supplementary metrics on the common eligible-and-interested population only", () => {
    // Population a, b, c (d wanted nothing). New placements 2, 1, 0.
    expect(m.eligibleGini).toBeCloseTo(gini([2, 1, 0]), 12);
    // New volunteers inside that population: a and c; only a was placed.
    expect(m.eligibleNewVolunteers).toBe(2);
    expect(m.eligibleNewVolunteersIncluded).toBe(1);
    expect(m.eligibleNewVolunteerInclusionRate).toBe(50);
    // The all-student versions are still computed separately.
    expect(m.newGini).toBeCloseTo(gini([2, 1, 0, 0]), 12);
    expect(m.newVolunteers).toBe(3);
  });

  it("measures skills, fill rate, reliability and conflicts", () => {
    expect(m.skillMatchedPlacements).toBe(2); // b lacks first aid
    expect(m.meanSkillAlignment).toBeCloseTo(2 / 3, 12);
    expect(m.totalSlots).toBe(4);
    expect(m.slotFillRate).toBe(75);
    expect(m.meanReliabilityOfPlaced).toBeCloseTo((0.5 + 0.9 + 0.5) / 3, 12);
    expect(m.timeConflicts).toBe(1); // a on m1 and m2
  });

  it("reports the gated mission with all three population sizes", () => {
    expect(m.gatedMissionShare).toBe(50);
    expect(m.gated).toEqual([
      {
        missionId: "m2",
        criteria: "SCI",
        slots: 2,
        criteriaEligible: 3,
        initialCandidates: 2,
        candidatePoolAtAllocation: 1,
        placed: 1,
        newVolunteerShareOfPlaced: 100,
        newVolunteerShareOfCandidates: 50,
      },
    ]);
    expect(m.gatedPlacements).toBe(1);
    expect(m.gatedPoolCoverageRate).toBe(50);
  });

  it("counts no conflicts for back-to-back missions", () => {
    const back = new Map([
      ["x", mission("x", "09:00", "11:00")],
      ["y", mission("y", "11:00", "13:00")],
    ]);
    const twoInARow: Allocation = {
      method: "voluntree",
      placements: [
        { missionId: "x", studentId: "a" },
        { missionId: "y", studentId: "a" },
      ],
      newCount: { a: 2 },
      candidatePool: {},
    };
    expect(countTimeConflicts(twoInARow, back)).toBe(0);
  });
});
