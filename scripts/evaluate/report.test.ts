import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateScenario } from "./generate";
import { TOLERANCE, buildReport, compare, format, formatDifference, verdict } from "./report";
import { MAIN_SEED, ROBUSTNESS_SEEDS, runEvaluation, runScenario } from "./run";

describe("verdict", () => {
  it("uses 0.5 percentage points for percentages", () => {
    expect(verdict("percent", "higher", 70.4, 70)).toBe("Equal");
    expect(verdict("percent", "higher", 70.6, 70)).toBe("Voluntree better");
    expect(verdict("percent", "higher", 69.4, 70)).toBe("FCFS better");
  });

  it("needs whole-number counts to match exactly", () => {
    expect(verdict("count", "lower", 5, 5)).toBe("Equal");
    expect(verdict("count", "lower", 4, 5)).toBe("Voluntree better");
    expect(verdict("count", "lower", 6, 5)).toBe("FCFS better");
  });

  it("uses 0.005 for 0–1 indexes", () => {
    expect(verdict("index", "lower", 0.504, 0.5)).toBe("Equal");
    expect(verdict("index", "lower", 0.49, 0.5)).toBe("Voluntree better");
    expect(verdict("index", "lower", 0.51, 0.5)).toBe("FCFS better");
  });

  it("gives no verdict for information-only rows", () => {
    expect(verdict("index", "none", 1, 0)).toBe("Information only");
  });

  it("exposes the tolerances", () => {
    expect(TOLERANCE).toEqual({ count: 0, percent: 0.5, index: 0.005 });
  });
});

describe("formatting", () => {
  it("formats values and signed differences", () => {
    expect(format("percent", 66.666)).toBe("66.7%");
    expect(format("index", 0.12345)).toBe("0.123");
    expect(format("count", 4)).toBe("4");
    expect(formatDifference("percent", 2.54)).toBe("+2.5 pp");
    expect(formatDifference("index", -0.0123)).toBe("−0.012");
    expect(formatDifference("count", 0)).toBe("0.00");
  });
});

describe("full evaluation", () => {
  const results = runEvaluation();

  it("runs the main seed, the equal-history scenario and 10 more seeds", () => {
    expect(results.main.seed).toBe(MAIN_SEED);
    expect(results.equalHistory.seed).toBe(MAIN_SEED);
    expect(results.robustness.map((r) => r.seed)).toEqual(ROBUSTNESS_SEEDS);
    expect(ROBUSTNESS_SEEDS).toHaveLength(10);
    expect(new Set(ROBUSTNESS_SEEDS).has(MAIN_SEED)).toBe(false);
  });

  it("is reproducible: two runs give identical results and reports", () => {
    expect(runEvaluation()).toEqual(results);
    expect(buildReport(runEvaluation())).toBe(buildReport(results));
  });

  it("gives different numbers for a different seed", () => {
    expect(runScenario(MAIN_SEED + 100, "other").metrics).not.toEqual(results.main.metrics);
  });

  it("uses the same coverage denominator for every method", () => {
    const m = results.main.metrics;
    expect(m.voluntree.coverageDenominator).toBe(m["fcfs-random"].coverageDenominator);
    expect(m.voluntree.coverageDenominator).toBe(m["fcfs-engaged"].coverageDenominator);
    expect(m.voluntree.newVolunteers).toBe(m["fcfs-random"].newVolunteers);
  });

  it("uses the same population for the supplementary metrics in every method", () => {
    const m = results.main.metrics;
    for (const method of ["fcfs-random", "fcfs-engaged"] as const) {
      expect(m[method].eligibleNewVolunteers).toBe(m.voluntree.eligibleNewVolunteers);
    }
    // Recount directly: students in the common population with no history.
    const history = generateScenario(MAIN_SEED).history;
    const expected = results.main.populations.initialEligibleInterested.filter((id) => history[id] === 0).length;
    expect(m.voluntree.eligibleNewVolunteers).toBe(expected);
    expect(m.voluntree.eligibleNewVolunteers).toBeLessThanOrEqual(m.voluntree.newVolunteers);
  });

  it("shows the supplementary rows next to the all-student rows, with exact counts", () => {
    const report = buildReport(results);
    const m = results.main.metrics;
    expect(report).toContain("Gini of new placements (all students)");
    expect(report).toContain("Gini of new placements among eligible-and-interested students (supplementary)");
    expect(report).toContain("New volunteers with ≥ 1 placement");
    expect(report).toContain(
      `Voluntree ${m.voluntree.eligibleNewVolunteersIncluded} of ${m.voluntree.eligibleNewVolunteers}; FCFS ${m["fcfs-random"].eligibleNewVolunteersIncluded} of ${m["fcfs-random"].eligibleNewVolunteers}`,
    );
  });

  it("states the matching weights actually used without proximity", () => {
    expect(buildReport(results)).toContain(
      "skill 35/60 (58.3%), opportunity balance 20/60 (33.3%) and reliability 5/60 (8.3%)",
    );
  });

  it("reports zero time conflicts for both methods as Equal, not as a failure", () => {
    const row = compare(results.main.metrics.voluntree, results.main.metrics["fcfs-random"]).find((r) =>
      r.label.startsWith("Time conflicts"),
    )!;
    expect(row.voluntree).toBe(0);
    expect(row.baseline).toBe(0);
    expect(row.verdict).toBe("Equal");
    expect(row.note).toContain("Both 0");
  });

  it("lists every Equal or FCFS-better row in the honesty section", () => {
    const report = buildReport(results);
    const rows = compare(results.main.metrics.voluntree, results.main.metrics["fcfs-random"]);
    const section = report.split("### Where FCFS-random is equal or better")[1].split("## 2.")[0];
    for (const row of rows.filter((r) => r.verdict === "Equal" || r.verdict === "FCFS better")) {
      expect(section).toContain(row.label);
    }
  });

  it("matches the committed results.md (re-run the script after changing the evaluation)", () => {
    const committed = readFileSync(new URL("./results.md", import.meta.url), "utf8");
    expect(committed).toBe(buildReport(results));
  });
});
