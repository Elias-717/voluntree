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
  const configurations = [results.live, results.future];

  it("runs the main seed, the equal-history scenario and 10 more seeds for both configurations", () => {
    expect(results.live.configuration).toBe("live");
    expect(results.future.configuration).toBe("future");
    for (const r of configurations) {
      expect(r.main.seed).toBe(MAIN_SEED);
      expect(r.equalHistory.seed).toBe(MAIN_SEED);
      expect(r.robustness.map((x) => x.seed)).toEqual(ROBUSTNESS_SEEDS);
    }
    expect(ROBUSTNESS_SEEDS).toHaveLength(10);
    expect(new Set(ROBUSTNESS_SEEDS).has(MAIN_SEED)).toBe(false);
  });

  it("is reproducible: two runs give identical results and reports", () => {
    expect(runEvaluation()).toEqual(results);
    expect(buildReport(runEvaluation())).toBe(buildReport(results));
  });

  it("gives different numbers for a different seed", () => {
    expect(runScenario(MAIN_SEED + 100, "other").metrics).not.toEqual(results.future.main.metrics);
    expect(runScenario(MAIN_SEED + 100, "other", {}, "live").metrics).not.toEqual(results.live.main.metrics);
  });

  it("keeps the future configuration's original results unchanged (Task 4 numbers)", () => {
    const m = results.future.main.metrics;
    expect(m.voluntree.newGini.toFixed(3)).toBe("0.551");
    expect(m["fcfs-random"].newGini.toFixed(3)).toBe("0.561");
    expect(m.voluntree.eligibleGini.toFixed(3)).toBe("0.439");
    expect(m["fcfs-random"].eligibleGini.toFixed(3)).toBe("0.451");
    expect([m.voluntree.eligibleNewVolunteersIncluded, m.voluntree.eligibleNewVolunteers]).toEqual([29, 32]);
    expect([m["fcfs-random"].eligibleNewVolunteersIncluded, m["fcfs-random"].eligibleNewVolunteers]).toEqual([24, 32]);
    expect([m.voluntree.coveredStudents, m["fcfs-random"].coveredStudents, m.voluntree.coverageDenominator]).toEqual([61, 62, 80]);
    expect(m.voluntree.skillMatchedRate.toFixed(1)).toBe("64.8");
  });

  it("uses the same coverage denominator for every method, in both configurations", () => {
    for (const { main } of configurations) {
      const m = main.metrics;
      expect(m.voluntree.coverageDenominator).toBe(m["fcfs-random"].coverageDenominator);
      expect(m.voluntree.coverageDenominator).toBe(m["fcfs-engaged"].coverageDenominator);
      expect(m.voluntree.newVolunteers).toBe(m["fcfs-random"].newVolunteers);
    }
    // Self-selection by ability to attend gives the live configuration the same population as the future one.
    expect(results.live.main.populations.initialEligibleInterested).toEqual(
      results.future.main.populations.initialEligibleInterested,
    );
  });

  it("gives FCFS-random identical results in both configurations (it ignores skills and reliability)", () => {
    const live = results.live.main.metrics["fcfs-random"];
    const future = results.future.main.metrics["fcfs-random"];
    expect(live.newGini).toBe(future.newGini);
    expect(live.coveredStudents).toBe(future.coveredStudents);
    expect(live.newDistribution).toEqual(future.newDistribution);
  });

  it("uses the same population for the supplementary metrics in every method", () => {
    const m = results.future.main.metrics;
    for (const method of ["fcfs-random", "fcfs-engaged"] as const) {
      expect(m[method].eligibleNewVolunteers).toBe(m.voluntree.eligibleNewVolunteers);
    }
    // Recount directly: students in the common population with no history.
    const history = generateScenario(MAIN_SEED).history;
    const expected = results.future.main.populations.initialEligibleInterested.filter((id) => history[id] === 0).length;
    expect(m.voluntree.eligibleNewVolunteers).toBe(expected);
    expect(m.voluntree.eligibleNewVolunteers).toBeLessThanOrEqual(m.voluntree.newVolunteers);
  });

  it("shows the supplementary rows next to the all-student rows, with exact counts", () => {
    const report = buildReport(results);
    const m = results.future.main.metrics;
    expect(report).toContain("Gini of new placements (all students)");
    expect(report).toContain("Gini of new placements among eligible-and-interested students (supplementary)");
    expect(report).toContain("New volunteers with ≥ 1 placement");
    expect(report).toContain(
      `Voluntree ${m.voluntree.eligibleNewVolunteersIncluded} of ${m.voluntree.eligibleNewVolunteers}; FCFS ${m["fcfs-random"].eligibleNewVolunteersIncluded} of ${m["fcfs-random"].eligibleNewVolunteers}`,
    );
  });

  it("states the weights in effect for each configuration, in its own part", () => {
    const report = buildReport(results);
    const [partA, partB] = report.split("# Part B — Future configuration");
    expect(partA).toContain("opportunity balance 20/25 (80%) and reliability 5/25 (20%)");
    expect(partA).toContain("The ranking is decided by opportunity balance alone");
    expect(partB).toContain("skill 35/60 (58.3%), opportunity balance 20/60 (33.3%) and reliability 5/60 (8.3%)");
    expect(report).toContain("not real-world validation");
  });

  it("marks skill metrics and mean reliability Not applicable in the live configuration only", () => {
    const live = compare(results.live.main.metrics.voluntree, results.live.main.metrics["fcfs-random"], "live");
    const future = compare(results.future.main.metrics.voluntree, results.future.main.metrics["fcfs-random"], "future");
    const notApplicable = ["Skill-matched placements", "Mean skill alignment", "Mean reliability of placed students"];
    for (const label of notApplicable) {
      expect(live.find((r) => r.label.startsWith(label))!.verdict).toBe("Not applicable");
      expect(future.find((r) => r.label.startsWith(label))!.verdict).not.toBe("Not applicable");
    }
    expect(live.filter((r) => r.verdict === "Not applicable")).toHaveLength(3);
    // Left out of the live robustness table and the live "equal or better" lists.
    const partA = buildReport(results).split("# Part B")[0];
    const robustness = partA.split("## A5.")[1].split("## A6.")[0];
    const lists = partA.split("### A: Where FCFS-random is equal or better").slice(1).join("");
    for (const label of notApplicable) {
      expect(robustness).not.toContain(label);
      expect(lists.split("\n").filter((l) => l.startsWith("- **")).join("\n")).not.toContain(label);
    }
  });

  it("reports zero time conflicts for both methods as Equal, not as a failure, in both configurations", () => {
    for (const { configuration, main } of configurations) {
      const row = compare(main.metrics.voluntree, main.metrics["fcfs-random"], configuration).find((r) =>
        r.label.startsWith("Time conflicts"),
      )!;
      expect([row.voluntree, row.baseline, row.verdict]).toEqual([0, 0, "Equal"]);
      expect(row.note).toContain("Both 0");
    }
  });

  it("lists every Equal or FCFS-better row in each part's honesty section", () => {
    const report = buildReport(results);
    for (const { configuration, main } of configurations) {
      const part = configuration === "live" ? "A" : "B";
      const rows = compare(main.metrics.voluntree, main.metrics["fcfs-random"], configuration);
      const section = report.split(`### ${part}: Where FCFS-random is equal or better`)[1].split(`## ${part}2.`)[0];
      for (const row of rows.filter((r) => r.verdict === "Equal" || r.verdict === "FCFS better")) {
        expect(section).toContain(row.label);
      }
    }
  });

  it("matches the committed results.md (re-run the script after changing the evaluation)", () => {
    const committed = readFileSync(new URL("./results.md", import.meta.url), "utf8");
    expect(committed).toBe(buildReport(results));
  });
});
