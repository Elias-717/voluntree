import { describe, expect, it } from "vitest";
import { matchStudentsToMission } from "../../src/lib/matching/matching";
import { ENGAGED_BONUS_CAP, SKILLS, generateScenario } from "./generate";

const SEED = 20261028;

describe("generateScenario", () => {
  const scenario = generateScenario(SEED);

  it("creates 100 students and 20 missions with unique IDs", () => {
    expect(scenario.students).toHaveLength(100);
    expect(scenario.missions).toHaveLength(20);
    expect(new Set(scenario.students.map((s) => s.id)).size).toBe(100);
    expect(new Set(scenario.missions.map((m) => m.id)).size).toBe(20);
  });

  it("is deterministic: the same seed gives identical data, another seed differs", () => {
    expect(generateScenario(SEED)).toEqual(scenario);
    expect(generateScenario(SEED + 1)).not.toEqual(scenario);
  });

  it("keeps every student field within its synthetic rules", () => {
    for (const s of scenario.students) {
      expect(s.cgpa === null || (s.cgpa >= 2 && s.cgpa <= 4)).toBe(true);
      expect(s.skills.length).toBeGreaterThanOrEqual(1);
      expect(s.skills.length).toBeLessThanOrEqual(3);
      expect(new Set(s.skills).size).toBe(s.skills.length);
      expect(s.skills.every((skill) => (SKILLS as readonly string[]).includes(skill))).toBe(true);
      expect(Number.isInteger(scenario.history[s.id]) && scenario.history[s.id] >= 0).toBe(true);
      expect(scenario.history[s.id]).toBeLessThanOrEqual(12);
      expect(s.recentOpportunities).toBe(scenario.history[s.id]);
      // Reliability is null exactly for new students (cold start).
      expect(s.reliability === null).toBe(scenario.history[s.id] === 0);
      expect(s.commitments).toEqual([]);
      expect(s.matchingOptOut).toBe(false);
      expect(s.proximity).toBeUndefined();
    }
  });

  it("includes students with no CGPA, empty availability and no history", () => {
    expect(scenario.students.some((s) => s.cgpa === null)).toBe(true);
    expect(scenario.students.some((s) => s.availability.length === 0)).toBe(true);
    expect(scenario.students.filter((s) => scenario.history[s.id] === 0).length).toBeGreaterThan(20);
    expect(scenario.students.some((s) => scenario.history[s.id] >= 6)).toBe(true);
  });

  it("keeps every mission within its rules, with exactly 5 gated missions", () => {
    for (const m of scenario.missions) {
      expect(m.capacity).toBeGreaterThanOrEqual(3);
      expect(m.capacity).toBeLessThanOrEqual(8);
      expect(m.requiredSkills.length).toBeGreaterThanOrEqual(1);
      expect(m.requiredSkills.length).toBeLessThanOrEqual(2);
      expect(m.status).toBe("PUBLISHED");
      expect(m.acceptedCount).toBe(0);
      const hours = (Date.parse(m.window.end) - Date.parse(m.window.start)) / 3_600_000;
      expect(hours).toBeGreaterThanOrEqual(2);
      expect(hours).toBeLessThanOrEqual(4);
    }
    const gated = scenario.missions.filter((m) => m.eligibleSchools.length > 0 || m.minCgpa !== null);
    expect(gated).toHaveLength(5);
    expect(scenario.missions.filter((m) => m.deanApprovalRequired)).toHaveLength(2);
    expect(gated.every((m) => m.minCgpa === null || m.minCgpa === 3)).toBe(true);
  });

  it("produces data that passes the matching engine's input checks", () => {
    for (const mission of scenario.missions) {
      expect(() => matchStudentsToMission(mission, scenario.students)).not.toThrow();
    }
  });

  it("lists each mission's interested students and a full arrival order for both FCFS variants", () => {
    const ids = scenario.students.map((s) => s.id).sort();
    for (const m of scenario.missions) {
      expect(scenario.interest[m.id].every((id) => ids.includes(id))).toBe(true);
      expect([...scenario.arrivalRandom[m.id]].sort()).toEqual(ids);
      expect([...scenario.arrivalEngaged[m.id]].sort()).toEqual(ids);
    }
    const share = scenario.missions.reduce((sum, m) => sum + scenario.interest[m.id].length, 0) / 2000;
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.4);
  });

  it("keeps the engaged head start small and capped", () => {
    expect(ENGAGED_BONUS_CAP).toBeLessThanOrEqual(0.25);
    // With equal history there is no head start, so both arrival orders are identical.
    const equal = generateScenario(SEED, { history: "equal" });
    expect(equal.arrivalEngaged).toEqual(equal.arrivalRandom);
  });

  it("changes only history and reliability in the equal-history variant", () => {
    const equal = generateScenario(SEED, { history: "equal" });
    expect(Object.values(equal.history).every((h) => h === 0)).toBe(true);
    expect(equal.missions).toEqual(scenario.missions);
    expect(equal.interest).toEqual(scenario.interest);
    expect(equal.arrivalRandom).toEqual(scenario.arrivalRandom);
    equal.students.forEach((s, i) => {
      const { recentOpportunities, reliability, ...rest } = scenario.students[i];
      void recentOpportunities;
      void reliability;
      expect(s).toEqual({ ...rest, recentOpportunities: 0, reliability: null });
    });
  });

  it("rejects impossible options", () => {
    expect(() => generateScenario(SEED, { missions: 30 })).toThrow(RangeError);
    expect(() => generateScenario(SEED, { missions: 4, gatedMissions: 5 })).toThrow(RangeError);
  });
});
