import { describe, expect, it } from "vitest";
import type { Commitment, Mission, MissionStatus, Student, TimeWindow } from "@/types/domain";
import {
  ALGORITHM_VERSION,
  NEUTRAL_RELIABILITY,
  matchStudentsToMission,
  recommendMissionsForStudent,
} from "./matching";

// ---------------------------------------------------------------------------
// Fixed synthetic fixtures. All times are in AIU local time (+08:00).

function at(day: number, time: string): string {
  return `2026-11-${String(day).padStart(2, "0")}T${time}:00+08:00`;
}

function window(day: number, start: string, end: string): TimeWindow {
  return { start: at(day, start), end: at(day, end) };
}

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "m-desk",
    organizationId: "org-1",
    title: "Orientation Week Welcome Desk",
    requiredSkills: ["registration desk"],
    window: window(3, "09:00", "13:00"),
    capacity: 4,
    acceptedCount: 0,
    status: "PUBLISHED",
    source: "manual",
    eligibleSchools: [],
    minCgpa: null,
    deanApprovalRequired: false,
    ...overrides,
  };
}

function makeStudent(id: string, overrides: Partial<Student> = {}): Student {
  return {
    id,
    displayName: `Student ${id}`,
    skills: ["registration desk"],
    availability: [window(3, "08:00", "18:00")],
    matchingOptOut: false,
    school: "SCI",
    cgpa: 3.5,
    recentOpportunities: 0,
    reliability: 0.8,
    commitments: [],
    ...overrides,
  };
}

function commitment(missionId: string, status: Commitment["status"], w: TimeWindow): Commitment {
  return { missionId, status, window: w };
}

function reasonsFor(mission: Mission, student: Student) {
  const { exclusions } = matchStudentsToMission(mission, [student]);
  return exclusions.find((e) => e.studentId === student.id)?.reasons ?? [];
}

function recommendationFor(mission: Mission, student: Student) {
  return matchStudentsToMission(mission, [student]).recommendations.find(
    (r) => r.studentId === student.id,
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// ---------------------------------------------------------------------------

describe("Stage 1: assignment statuses (BR-02, DEC-036)", () => {
  it.each(["PENDING_DEAN_APPROVAL", "ACCEPTED", "DEAN_REJECTED"] as const)(
    "excludes a student with a %s assignment for the same mission as ALREADY_ASSIGNED",
    (status) => {
      const mission = makeMission();
      const student = makeStudent("s1", { commitments: [commitment("m-desk", status, mission.window)] });
      expect(reasonsFor(mission, student)).toEqual(["ALREADY_ASSIGNED"]);
    },
  );

  it.each(["PENDING_DEAN_APPROVAL", "ACCEPTED"] as const)(
    "excludes an overlapping %s assignment on another mission as TIME_CONFLICT",
    (status) => {
      const student = makeStudent("s1", {
        commitments: [commitment("m-other", status, window(3, "12:00", "15:00"))],
      });
      expect(reasonsFor(makeMission(), student)).toEqual(["TIME_CONFLICT"]);
    },
  );

  it("ignores an overlapping DEAN_REJECTED assignment on another mission", () => {
    const student = makeStudent("s1", {
      commitments: [commitment("m-other", "DEAN_REJECTED", window(3, "10:00", "12:00"))],
    });
    expect(recommendationFor(makeMission(), student)).toBeDefined();
  });

  it("does not treat missions that only touch as a time conflict", () => {
    const student = makeStudent("s1", {
      commitments: [
        commitment("m-before", "ACCEPTED", window(3, "07:00", "09:00")),
        commitment("m-after", "PENDING_DEAN_APPROVAL", window(3, "13:00", "15:00")),
      ],
    });
    expect(recommendationFor(makeMission(), student)).toBeDefined();
  });

  it("does not count the same mission as a time conflict with itself", () => {
    const mission = makeMission();
    const student = makeStudent("s1", { commitments: [commitment("m-desk", "ACCEPTED", mission.window)] });
    expect(reasonsFor(mission, student)).not.toContain("TIME_CONFLICT");
  });
});

describe("Stage 1: availability (DEC-036)", () => {
  const mission = makeMission({ window: window(3, "09:00", "13:00") });

  it("recommends a new student with empty availability as UNKNOWN", () => {
    const newcomer = makeStudent("s-new", { availability: [], reliability: null, recentOpportunities: 0 });
    const rec = recommendationFor(mission, newcomer);
    expect(rec?.availability).toBe("UNKNOWN");
    expect(rec?.factors.find((f) => f.name === "reliability")?.value).toBe(NEUTRAL_RELIABILITY);
  });

  it("excludes partial availability as NOT_AVAILABLE", () => {
    const student = makeStudent("s1", { availability: [window(3, "09:00", "12:00")] });
    expect(reasonsFor(mission, student)).toEqual(["NOT_AVAILABLE"]);
  });

  it("excludes availability declared only on another day", () => {
    const student = makeStudent("s1", { availability: [window(4, "08:00", "18:00")] });
    expect(reasonsFor(mission, student)).toEqual(["NOT_AVAILABLE"]);
  });

  it("passes full availability as FULL, including a window larger than the mission", () => {
    const exact = makeStudent("s-exact", { availability: [window(3, "09:00", "13:00")] });
    const larger = makeStudent("s-larger", { availability: [window(3, "06:00", "20:00")] });
    expect(recommendationFor(mission, exact)?.availability).toBe("FULL");
    expect(recommendationFor(mission, larger)?.availability).toBe("FULL");
  });

  it("joins touching windows that together cover the mission", () => {
    const student = makeStudent("s1", {
      // Given out of order on purpose.
      availability: [window(3, "11:00", "13:00"), window(3, "09:00", "11:00")],
    });
    expect(recommendationFor(mission, student)?.availability).toBe("FULL");
  });

  it("joins overlapping windows that together cover the mission", () => {
    const student = makeStudent("s1", { availability: [window(3, "08:00", "11:30"), window(3, "10:00", "14:00")] });
    expect(recommendationFor(mission, student)?.availability).toBe("FULL");
  });

  it("excludes windows with a one-minute gap", () => {
    const student = makeStudent("s1", { availability: [window(3, "09:00", "10:59"), window(3, "11:00", "13:00")] });
    expect(reasonsFor(mission, student)).toEqual(["NOT_AVAILABLE"]);
  });

  it("compares times across time zones", () => {
    // 01:00Z to 05:00Z is 09:00 to 13:00 at +08:00.
    const student = makeStudent("s1", { availability: [{ start: "2026-11-03T01:00:00Z", end: "2026-11-03T05:00:00Z" }] });
    expect(recommendationFor(mission, student)?.availability).toBe("FULL");
  });

  it("gives the same score and factors for full and unknown availability", () => {
    const full = recommendationFor(mission, makeStudent("s1"));
    const unknown = recommendationFor(mission, makeStudent("s1", { availability: [] }));
    expect(unknown?.score).toBe(full?.score);
    expect(unknown?.factors).toEqual(full?.factors);
  });
});

describe("Stage 1: eligibility, opt-out and capacity (FR-025, FR-029, BR-15)", () => {
  it("excludes a school that is not on the list, and treats an empty list as all schools", () => {
    const gated = makeMission({ eligibleSchools: ["SCI", "SEHS"] });
    expect(reasonsFor(gated, makeStudent("s1", { school: "SBSS" }))).toEqual(["SCHOOL_NOT_ELIGIBLE"]);
    expect(recommendationFor(gated, makeStudent("s2", { school: "SEHS" }))).toBeDefined();
    expect(recommendationFor(makeMission({ eligibleSchools: [] }), makeStudent("s3", { school: "LC" }))).toBeDefined();
  });

  it("applies the minimum CGPA: below and missing fail, equal passes", () => {
    const gated = makeMission({ minCgpa: 3.0 });
    expect(reasonsFor(gated, makeStudent("s-below", { cgpa: 2.99 }))).toEqual(["CGPA_BELOW_MINIMUM"]);
    expect(reasonsFor(gated, makeStudent("s-none", { cgpa: null }))).toEqual(["CGPA_BELOW_MINIMUM"]);
    expect(recommendationFor(gated, makeStudent("s-equal", { cgpa: 3.0 }))).toBeDefined();
  });

  it("ignores a missing CGPA when no minimum is set", () => {
    expect(recommendationFor(makeMission({ minCgpa: null }), makeStudent("s1", { cgpa: null }))).toBeDefined();
  });

  it("excludes a student who opted out of matching", () => {
    expect(reasonsFor(makeMission(), makeStudent("s1", { matchingOptOut: true }))).toEqual(["OPTED_OUT"]);
  });

  it("excludes everyone from a full mission (pending and accepted both hold a slot)", () => {
    const full = makeMission({ capacity: 3, acceptedCount: 3 });
    const { recommendations, exclusions } = matchStudentsToMission(full, [makeStudent("a"), makeStudent("b")]);
    expect(recommendations).toEqual([]);
    expect(exclusions).toEqual([
      { studentId: "a", reasons: ["MISSION_FULL"] },
      { studentId: "b", reasons: ["MISSION_FULL"] },
    ]);
  });

  it("lists every failed rule, in the fixed order", () => {
    const mission = makeMission({ eligibleSchools: ["SCI"], minCgpa: 3.0, capacity: 1, acceptedCount: 1 });
    const student = makeStudent("s1", {
      school: "LC",
      cgpa: null,
      matchingOptOut: true,
      availability: [window(4, "08:00", "18:00")],
      commitments: [
        commitment("m-desk", "DEAN_REJECTED", mission.window),
        commitment("m-other", "ACCEPTED", window(3, "10:00", "11:00")),
      ],
    });
    expect(reasonsFor(mission, student)).toEqual([
      "ALREADY_ASSIGNED",
      "TIME_CONFLICT",
      "NOT_AVAILABLE",
      "SCHOOL_NOT_ELIGIBLE",
      "CGPA_BELOW_MINIMUM",
      "OPTED_OUT",
      "MISSION_FULL",
    ]);
  });

  it("does not exclude a student for missing skills, and ignores dean approval", () => {
    const mission = makeMission({ requiredSkills: ["first aid", "tutoring"], deanApprovalRequired: true });
    const rec = recommendationFor(mission, makeStudent("s1", { skills: ["photography"] }));
    expect(rec?.factors.find((f) => f.name === "skill")?.value).toBe(0);
  });
});

describe("Stage 2: scoring (SRS §10, DEC-036)", () => {
  it("uses the proportional weights 35/70, 20/70, 10/70 and 5/70 when all four factors apply", () => {
    const rec = recommendationFor(makeMission(), makeStudent("s1", { proximity: 0.5 }))!;
    expect(rec.factors.map((f) => [f.name, f.weight])).toEqual([
      ["skill", 35 / 70],
      ["opportunityBalance", 20 / 70],
      ["proximity", 10 / 70],
      ["reliability", 5 / 70],
    ]);
  });

  it("re-normalizes without proximity (35/60, 20/60, 5/60)", () => {
    const rec = recommendationFor(makeMission(), makeStudent("s1"))!;
    expect(rec.factors.map((f) => [f.name, f.weight])).toEqual([
      ["skill", 35 / 60],
      ["opportunityBalance", 20 / 60],
      ["reliability", 5 / 60],
    ]);
  });

  it("leaves out the skill factor when the mission lists no skills (20/35, 10/35, 5/35)", () => {
    const rec = recommendationFor(makeMission({ requiredSkills: [] }), makeStudent("s1", { proximity: 1 }))!;
    expect(rec.factors.map((f) => [f.name, f.weight])).toEqual([
      ["opportunityBalance", 20 / 35],
      ["proximity", 10 / 35],
      ["reliability", 5 / 35],
    ]);
  });

  it.each([
    ["all four factors", makeMission(), makeStudent("s1", { proximity: 0.3 })],
    ["no proximity", makeMission(), makeStudent("s1")],
    ["no skills", makeMission({ requiredSkills: [] }), makeStudent("s1")],
  ])("weights add up to 1 and contributions to the score (%s)", (_case, mission, student) => {
    const rec = recommendationFor(mission, student)!;
    expect(rec.factors.reduce((sum, f) => sum + f.weight, 0)).toBeCloseTo(1, 12);
    for (const f of rec.factors) expect(f.contribution).toBe(f.weight * f.value);
    expect(rec.score).toBe(rec.factors.reduce((sum, f) => sum + f.contribution, 0));
  });

  it("matches the worked example exactly, at full precision", () => {
    // 1 of 1 skill, 2 past participations, no proximity, new volunteer.
    const mission = makeMission({ requiredSkills: ["first aid"] });
    const student = makeStudent("s1", {
      skills: ["  First Aid "],
      recentOpportunities: 2,
      reliability: null,
    });
    const rec = recommendationFor(mission, student)!;
    const expected = (35 / 60) * 1 + (20 / 60) * (1 / 3) + (5 / 60) * 0.5;
    expect(rec.score).toBeCloseTo(expected, 15);
    expect(rec.score).toBeCloseTo(0.7361111111, 9);
    // Not rounded to 6 decimals.
    expect(rec.score).not.toBe(Math.round(rec.score * 1e6) / 1e6);
    expect(rec.factors.map((f) => f.value)).toEqual([1, 1 / 3, 0.5]);
  });

  it("matches skills ignoring capitals, spaces, blanks and duplicates", () => {
    const mission = makeMission({ requiredSkills: ["First Aid", "first aid ", "Tutoring", "  "] });
    const rec = recommendationFor(mission, makeStudent("s1", { skills: ["FIRST AID"] }))!;
    const skill = rec.factors.find((f) => f.name === "skill")!;
    expect(skill.value).toBe(0.5);
    expect(skill.explanation).toBe("Has 1 of 2 required skills");
  });

  it("gives fewer all-time participations a higher score (FR-024)", () => {
    const values = [0, 1, 3, 11].map(
      (n) => recommendationFor(makeMission(), makeStudent("s1", { recentOpportunities: n }))!,
    );
    expect(values.map((r) => r.factors.find((f) => f.name === "opportunityBalance")!.value)).toEqual([
      1, 0.5, 0.25, 1 / 12,
    ]);
    for (let i = 1; i < values.length; i++) expect(values[i].score).toBeLessThan(values[i - 1].score);
  });

  it("gives a new student the neutral reliability and still recommends them (cold start)", () => {
    const rec = recommendationFor(makeMission(), makeStudent("s-new", { reliability: null }))!;
    const reliability = rec.factors.find((f) => f.name === "reliability")!;
    expect(reliability.value).toBe(0.5);
    expect(reliability.explanation).toBe("New volunteer: neutral reliability (cold start)");
  });

  it("never lets CGPA change the score (BR-15)", () => {
    const low = recommendationFor(makeMission({ minCgpa: 3.0 }), makeStudent("s1", { cgpa: 3.0 }))!;
    const high = recommendationFor(makeMission({ minCgpa: 3.0 }), makeStudent("s1", { cgpa: 4.0 }))!;
    expect(high.score).toBe(low.score);
    expect(high.factors).toEqual(low.factors);
  });

  it("never lets the school change the score", () => {
    const sci = recommendationFor(makeMission(), makeStudent("s1", { school: "SCI" }))!;
    const lc = recommendationFor(makeMission(), makeStudent("s1", { school: "LC" }))!;
    expect(lc.score).toBe(sci.score);
  });

  it("never mentions CGPA, school or availability in Why recommended", () => {
    const rec = recommendationFor(
      makeMission({ eligibleSchools: ["SCI"], minCgpa: 3.0 }),
      makeStudent("s1", { proximity: 0.6, recentOpportunities: 1 }),
    )!;
    const text = rec.factors.map((f) => f.explanation).join(" ").toLowerCase();
    expect(text).not.toMatch(/cgpa|school|availab/);
    expect(rec.factors.map((f) => f.explanation)).toEqual([
      "Has 1 of 1 required skill",
      "1 approved participation so far: fewer means higher priority",
      "Coarse proximity: 60%",
      "Reliability: 80%",
    ]);
  });

  it("fills in the recommendation's IDs and algorithm version", () => {
    const rec = recommendationFor(makeMission(), makeStudent("s1"))!;
    expect(rec.missionId).toBe("m-desk");
    expect(rec.studentId).toBe("s1");
    expect(rec.algorithmVersion).toBe(ALGORITHM_VERSION);
  });
});

describe("Ranking and determinism", () => {
  const students = [
    makeStudent("s-c", { recentOpportunities: 2 }),
    makeStudent("s-a", { recentOpportunities: 0 }),
    makeStudent("s-b", { recentOpportunities: 0 }),
    makeStudent("s-d", { recentOpportunities: 5, matchingOptOut: true }),
  ];

  it("ranks by score, then by student ID for ties", () => {
    const { recommendations } = matchStudentsToMission(makeMission(), students);
    expect(recommendations.map((r) => r.studentId)).toEqual(["s-a", "s-b", "s-c"]);
  });

  it("treats scores equal at 6 decimals as a tie, without rounding the stored score", () => {
    const lower = makeStudent("s-a", { proximity: 0.5 });
    const higher = makeStudent("s-b", { proximity: 0.5000000001 });
    const { recommendations } = matchStudentsToMission(makeMission(), [higher, lower]);
    expect(recommendations.map((r) => r.studentId)).toEqual(["s-a", "s-b"]);
    expect(recommendations[1].score).toBeGreaterThan(recommendations[0].score);
  });

  it("gives the same output for shuffled input and repeated calls", () => {
    const first = matchStudentsToMission(makeMission(), students);
    const reversed = matchStudentsToMission(makeMission(), [...students].reverse());
    expect(reversed).toEqual(first);
    expect(matchStudentsToMission(makeMission(), students)).toEqual(first);
  });

  it("sorts exclusions by student ID", () => {
    const { exclusions } = matchStudentsToMission(makeMission(), [
      makeStudent("s-z", { matchingOptOut: true }),
      makeStudent("s-y", { matchingOptOut: true }),
    ]);
    expect(exclusions.map((e) => e.studentId)).toEqual(["s-y", "s-z"]);
  });

  it("does not change its inputs", () => {
    const mission = deepFreeze(makeMission());
    const frozen = deepFreeze([
      makeStudent("s-b", { availability: [window(3, "11:00", "13:00"), window(3, "09:00", "11:00")] }),
      makeStudent("s-a"),
    ]);
    expect(() => matchStudentsToMission(mission, frozen)).not.toThrow();
    expect(() => recommendMissionsForStudent(frozen[0], [mission])).not.toThrow();
  });
});

describe("Mission status", () => {
  it.each(["DRAFT", "COMPLETED", "CANCELLED"] as MissionStatus[])(
    "matchStudentsToMission throws a RangeError for a %s mission",
    (status) => {
      expect(() => matchStudentsToMission(makeMission({ status }), [makeStudent("s1")])).toThrow(
        new RangeError(`Only PUBLISHED missions can be matched. Mission m-desk is ${status}.`),
      );
    },
  );

  it("recommendMissionsForStudent skips non-published missions", () => {
    const missions = (["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"] as MissionStatus[]).map((status) =>
      makeMission({ id: `m-${status}`, status }),
    );
    expect(recommendMissionsForStudent(makeStudent("s1"), missions).map((r) => r.missionId)).toEqual([
      "m-PUBLISHED",
    ]);
  });
});

describe("recommendMissionsForStudent", () => {
  const student = makeStudent("s1", {
    skills: ["first aid"],
    school: "SBSS",
    cgpa: 3.2,
    availability: [window(3, "08:00", "18:00")],
    commitments: [commitment("m-assigned", "DEAN_REJECTED", window(3, "14:00", "16:00"))],
  });

  const missions = [
    makeMission({ id: "m-match", requiredSkills: ["first aid"], window: window(3, "09:00", "11:00") }),
    makeMission({ id: "m-nomatch", requiredSkills: ["tutoring"], window: window(3, "11:00", "13:00") }),
    makeMission({ id: "m-gated", eligibleSchools: ["SCI"], window: window(3, "09:00", "10:00") }),
    makeMission({ id: "m-cgpa", minCgpa: 3.5, window: window(3, "09:00", "10:00") }),
    makeMission({ id: "m-full", capacity: 2, acceptedCount: 2 }),
    makeMission({ id: "m-assigned", window: window(3, "14:00", "16:00") }),
    makeMission({ id: "m-other-day", window: window(5, "09:00", "11:00") }),
  ];

  it("hides gated, full, already-assigned and not-available missions, and ranks the rest", () => {
    const recs = recommendMissionsForStudent(student, missions);
    expect(recs.map((r) => r.missionId)).toEqual(["m-match", "m-nomatch"]);
    expect(recs[0].score).toBeGreaterThan(recs[1].score);
    expect(recs.every((r) => r.studentId === "s1" && r.availability === "FULL")).toBe(true);
  });

  it("returns an empty list for a student who opted out", () => {
    expect(recommendMissionsForStudent({ ...student, matchingOptOut: true }, missions)).toEqual([]);
  });

  it("marks every mission UNKNOWN for a student with empty availability", () => {
    const recs = recommendMissionsForStudent({ ...student, availability: [] }, missions);
    expect(recs.map((r) => r.missionId)).toEqual(["m-match", "m-nomatch", "m-other-day"]);
    expect(recs.every((r) => r.availability === "UNKNOWN")).toBe(true);
  });

  it("breaks score ties by mission ID", () => {
    const tied = [makeMission({ id: "m-2" }), makeMission({ id: "m-1" })];
    expect(recommendMissionsForStudent(makeStudent("s1"), tied).map((r) => r.missionId)).toEqual(["m-1", "m-2"]);
  });

  it("agrees with matchStudentsToMission for the same pair", () => {
    const mission = missions[0];
    const fromStudent = recommendMissionsForStudent(student, [mission])[0];
    const fromMission = matchStudentsToMission(mission, [student]).recommendations[0];
    expect(fromStudent).toEqual(fromMission);
  });
});

describe("Invalid input", () => {
  const mission = makeMission();
  const student = makeStudent("s1");

  it.each([
    ["an impossible date", { window: { start: "2026-02-30T09:00:00+08:00", end: "2026-03-02T13:00:00+08:00" } }],
    ["a time without a time zone", { window: { start: "2026-11-03T09:00:00", end: "2026-11-03T13:00:00" } }],
    ["an impossible hour", { window: { start: "2026-11-03T24:00:00+08:00", end: "2026-11-03T25:00:00+08:00" } }],
    ["a window that ends before it starts", { window: window(3, "13:00", "09:00") }],
    ["a negative capacity", { capacity: -1 }],
    ["a non-whole acceptedCount", { acceptedCount: 1.5 }],
    ["a minimum CGPA above 4", { minCgpa: 4.5 }],
    ["a minimum CGPA below 0", { minCgpa: -1 }],
  ])("rejects a mission with %s", (_case, overrides) => {
    expect(() => matchStudentsToMission(makeMission(overrides as Partial<Mission>), [student])).toThrow(RangeError);
  });

  it.each([
    ["an empty availability window", { availability: [window(3, "09:00", "09:00")] }],
    ["an unparseable availability time", { availability: [{ start: "tomorrow", end: "later" }] }],
    ["a bad commitment window", { commitments: [commitment("m-x", "ACCEPTED", window(3, "12:00", "10:00"))] }],
    ["negative recentOpportunities", { recentOpportunities: -1 }],
    ["non-whole recentOpportunities", { recentOpportunities: 1.5 }],
    ["reliability above 1", { reliability: 1.2 }],
    ["proximity below 0", { proximity: -0.1 }],
    ["NaN proximity", { proximity: NaN }],
    ["CGPA above 4", { cgpa: 4.01 }],
    ["CGPA below 0", { cgpa: -0.5 }],
  ])("rejects a student with %s", (_case, overrides) => {
    expect(() => matchStudentsToMission(mission, [makeStudent("s1", overrides as Partial<Student>)])).toThrow(
      RangeError,
    );
    expect(() => recommendMissionsForStudent(makeStudent("s1", overrides as Partial<Student>), [mission])).toThrow(
      RangeError,
    );
  });

  it.each([
    ["+25:00", "an offset hour above 23"],
    ["+08:99", "offset minutes above 59"],
    ["+14:30", "an offset beyond +14:00"],
    ["-15:00", "an offset beyond -14:00"],
    ["+8:00", "a one-digit offset hour"],
    ["+0800", "an offset without a colon"],
  ])("rejects the time zone offset %s (%s)", (offset) => {
    const bad = { start: `2026-11-03T09:00:00${offset}`, end: "2026-11-03T13:00:00+08:00" };
    expect(() => matchStudentsToMission(makeMission({ window: bad }), [student])).toThrow(
      new RangeError(`Not a valid ISO date-time with a time zone: 2026-11-03T09:00:00${offset}`),
    );
    expect(() => matchStudentsToMission(mission, [makeStudent("s1", { availability: [bad] })])).toThrow(RangeError);
    expect(() =>
      matchStudentsToMission(mission, [makeStudent("s1", { commitments: [commitment("m-x", "ACCEPTED", bad)] })]),
    ).toThrow(RangeError);
  });

  it.each(["+14:00", "-12:00", "+05:45", "-00:30", "+00:00"])(
    "accepts the real time zone offset %s and compares it correctly",
    (offset) => {
      // The same instant as 09:00 to 13:00 at +08:00, written in another offset.
      const shift = (iso: string) => new Date(Date.parse(iso)).toISOString().replace(".000Z", "Z");
      const startUtc = shift("2026-11-03T09:00:00+08:00");
      const endUtc = shift("2026-11-03T13:00:00+08:00");
      const sign = offset[0] === "-" ? -1 : 1;
      const minutes = sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
      const local = (utc: string) =>
        new Date(Date.parse(utc) + minutes * 60_000).toISOString().slice(0, 19) + offset;
      const availability = [{ start: local(startUtc), end: local(endUtc) }];
      expect(recommendationFor(mission, makeStudent("s1", { availability }))?.availability).toBe("FULL");
    },
  );

  it("accepts CGPA values at both ends of 0.00 to 4.00", () => {
    expect(() => matchStudentsToMission(mission, [makeStudent("a", { cgpa: 0 }), makeStudent("b", { cgpa: 4 })])).not.toThrow();
  });

  it("rejects duplicate student IDs", () => {
    expect(() => matchStudentsToMission(mission, [makeStudent("s1"), makeStudent("s1")])).toThrow(
      new RangeError("Duplicate student ID: s1"),
    );
  });

  it("rejects duplicate mission IDs", () => {
    expect(() => recommendMissionsForStudent(student, [makeMission(), makeMission()])).toThrow(
      new RangeError("Duplicate mission ID: m-desk"),
    );
  });

  it("checks non-published missions too", () => {
    expect(() =>
      recommendMissionsForStudent(student, [makeMission({ status: "DRAFT", capacity: -1 })]),
    ).toThrow(RangeError);
  });
});

describe("Demo seed scenario (rebuilt from supabase/seed.sql)", () => {
  // Availability as seeded for students 11 to 18 (DEC-021, DEC-036).
  const seedAvailability: Record<string, TimeWindow[]> = {
    s11: [window(3, "08:00", "18:00"), window(4, "13:00", "18:00")],
    s12: [window(3, "08:00", "14:00")],
    s13: [window(3, "09:00", "17:00"), window(4, "09:00", "17:00")],
    s14: [window(3, "08:00", "13:00"), window(4, "13:00", "18:00")],
    s15: [window(3, "08:00", "18:00")],
    s16: [window(4, "08:00", "18:00")],
    s17: [window(3, "12:00", "18:00")],
    s18: [{ start: at(3, "08:00"), end: at(4, "18:00") }],
  };
  const seedProfile: Record<string, Pick<Student, "school" | "cgpa" | "skills">> = {
    s11: { school: "SCI", cgpa: 3.8, skills: ["first aid", "tutoring"] },
    s12: { school: "SBSS", cgpa: 3.2, skills: ["registration desk", "social media"] },
    s13: { school: "SEHS", cgpa: 2.9, skills: ["event setup", "logistics"] },
    s14: { school: "SCI", cgpa: 3.5, skills: ["registration desk", "photography"] },
    s15: { school: "CFGS", cgpa: null, skills: ["translation (Arabic)", "registration desk"] },
    s16: { school: "LC", cgpa: 2.4, skills: ["event setup"] },
    s17: { school: "SBSS", cgpa: 3.0, skills: ["social media", "photography", "logistics"] },
    s18: { school: "SCI", cgpa: 2.7, skills: ["first aid", "event setup", "logistics"] },
  };
  const seedStudents = Object.keys(seedProfile).map((id) =>
    makeStudent(id, { ...seedProfile[id], availability: seedAvailability[id] }),
  );

  it("Welcome Desk: students 16 and 17 are not available; the other six are recommended", () => {
    const desk = makeMission({ id: "m-2001", window: window(3, "09:00", "13:00"), capacity: 4 });
    const { recommendations, exclusions } = matchStudentsToMission(desk, seedStudents);
    expect(exclusions).toEqual([
      { studentId: "s16", reasons: ["NOT_AVAILABLE"] },
      { studentId: "s17", reasons: ["NOT_AVAILABLE"] },
    ]);
    expect(recommendations.map((r) => r.studentId).sort()).toEqual(["s11", "s12", "s13", "s14", "s15", "s18"]);
  });

  it("SCI Showcase: students 11 and 14 qualify; student 18 fails only the CGPA minimum", () => {
    const showcase = makeMission({
      id: "m-2002",
      requiredSkills: ["tutoring", "registration desk"],
      window: window(4, "14:00", "17:00"),
      capacity: 3,
      eligibleSchools: ["SCI"],
      minCgpa: 3.0,
      deanApprovalRequired: true,
    });
    const { recommendations, exclusions } = matchStudentsToMission(showcase, seedStudents);
    expect(recommendations.map((r) => r.studentId).sort()).toEqual(["s11", "s14"]);
    expect(exclusions.find((e) => e.studentId === "s18")?.reasons).toEqual(["CGPA_BELOW_MINIMUM"]);
  });
});
