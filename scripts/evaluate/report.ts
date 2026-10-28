// Comparison verdicts and the Markdown report (FR-026).
// Verdicts are computed from the numbers, never written by hand, so a case where FCFS
// is equal or better is always reported as such.

import type { Method } from "./allocate";
import type { Metrics, Populations } from "./metrics";

export type Kind = "count" | "percent" | "index";
export type Better = "lower" | "higher" | "none";
export type Verdict = "Voluntree better" | "Equal" | "FCFS better" | "Information only";

/**
 * Differences within these margins count as "Equal":
 * whole-number counts must match exactly, percentages within 0.5 points, 0–1 indexes within 0.005.
 */
export const TOLERANCE: Record<Kind, number> = { count: 0, percent: 0.5, index: 0.005 };

export interface ScenarioResult {
  label: string;
  seed: number;
  populations: Populations;
  metrics: Record<Method, Metrics>;
}

export interface EvaluationResults {
  main: ScenarioResult;
  equalHistory: ScenarioResult;
  robustness: ScenarioResult[];
}

export interface Comparison {
  label: string;
  kind: Kind;
  better: Better;
  voluntree: number;
  baseline: number;
  verdict: Verdict;
  note: string;
}

export function verdict(kind: Kind, better: Better, voluntree: number, baseline: number): Verdict {
  if (better === "none") return "Information only";
  const difference = voluntree - baseline;
  if (Math.abs(difference) <= TOLERANCE[kind] + 1e-12) return "Equal";
  const voluntreeHigher = difference > 0;
  return voluntreeHigher === (better === "higher") ? "Voluntree better" : "FCFS better";
}

interface Row {
  label: string;
  kind: Kind;
  better: Better;
  value: (m: Metrics) => number;
  detail?: (m: Metrics) => string;
  /** A note that is the same for both methods, shown once. */
  sharedNote?: (m: Metrics) => string;
}

/** The metrics compared, in priority order (fairness first, supporting metrics after). */
export const ROWS: Row[] = [
  { label: "Gini of new placements (all students)", kind: "index", better: "lower", value: (m) => m.newGini },
  {
    label: "Gini of new placements among eligible-and-interested students (supplementary)",
    kind: "index",
    better: "lower",
    value: (m) => m.eligibleGini,
    sharedNote: (m) => `${m.coverageDenominator} students, the same for every method`,
  },
  { label: "Max–min gap of new placements", kind: "count", better: "lower", value: (m) => m.newMaxMinGap },
  { label: "Gini of history + new (combined)", kind: "index", better: "lower", value: (m) => m.combinedGini },
  { label: "Max–min gap of history + new (combined)", kind: "count", better: "lower", value: (m) => m.combinedMaxMinGap },
  {
    label: "New volunteers with ≥ 1 placement",
    kind: "percent",
    better: "higher",
    value: (m) => m.newVolunteerInclusionRate,
    detail: (m) => `${m.newVolunteersIncluded} of ${m.newVolunteers}`,
  },
  {
    label: "Eligible-and-interested new volunteers with ≥ 1 placement (supplementary)",
    kind: "percent",
    better: "higher",
    value: (m) => m.eligibleNewVolunteerInclusionRate,
    detail: (m) => `${m.eligibleNewVolunteersIncluded} of ${m.eligibleNewVolunteers}`,
  },
  {
    label: "Eligible-and-interested students with ≥ 1 placement",
    kind: "percent",
    better: "higher",
    value: (m) => m.coverageRate,
    detail: (m) => `${m.coveredStudents} of ${m.coverageDenominator}`,
  },
  { label: "Gini of gated placements within gated pools", kind: "index", better: "lower", value: (m) => m.gatedPoolGini },
  {
    label: "Gated-pool students with ≥ 1 gated placement",
    kind: "percent",
    better: "higher",
    value: (m) => m.gatedPoolCoverageRate,
  },
  {
    label: "Skill-matched placements (≥ 1 required skill)",
    kind: "percent",
    better: "higher",
    value: (m) => m.skillMatchedRate,
    detail: (m) => `${m.skillMatchedPlacements} of ${m.placements}`,
  },
  { label: "Mean skill alignment of placements", kind: "index", better: "higher", value: (m) => m.meanSkillAlignment },
  {
    label: "Slot fill rate",
    kind: "percent",
    better: "higher",
    value: (m) => m.slotFillRate,
    detail: (m) => `${m.placements} of ${m.totalSlots}`,
  },
  { label: "Time conflicts in placements", kind: "count", better: "lower", value: (m) => m.timeConflicts },
  {
    label: "Mean reliability of placed students (new = 0.5)",
    kind: "index",
    better: "higher",
    value: (m) => m.meanReliabilityOfPlaced,
  },
  {
    label: "Most experienced 10%: mean new placements",
    kind: "index",
    better: "none",
    value: (m) => m.mostExperiencedMeanNew,
  },
  {
    label: "Total candidate pool over all missions",
    kind: "count",
    better: "none",
    value: (m) => m.totalCandidatePool,
  },
];

export function compare(voluntree: Metrics, baseline: Metrics): Comparison[] {
  return ROWS.map((row) => {
    const v = row.value(voluntree);
    const b = row.value(baseline);
    const result = verdict(row.kind, row.better, v, b);
    let note = row.detail ? `Voluntree ${row.detail(voluntree)}; FCFS ${row.detail(baseline)}` : "";
    if (row.sharedNote) note = row.sharedNote(voluntree);
    if (row.label.startsWith("Time conflicts") && v === 0 && b === 0) {
      note = "Both 0: both respect the shared overlap rule, as accept_mission does";
    }
    return { label: row.label, kind: row.kind, better: row.better, voluntree: v, baseline: b, verdict: result, note };
  });
}

/** A signed difference: percentages in percentage points, counts and indexes as numbers. */
export function formatDifference(kind: Kind, value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const size = Math.abs(value);
  if (kind === "percent") return `${sign}${size.toFixed(1)} pp`;
  if (kind === "index") return `${sign}${size.toFixed(3)}`;
  return `${sign}${size.toFixed(2)}`;
}

export function format(kind: Kind, value: number): string {
  if (kind === "percent") return `${value.toFixed(1)}%`;
  if (kind === "index") return value.toFixed(3);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// ---------------------------------------------------------------------------
// Markdown

export function buildReport(results: EvaluationResults): string {
  const { main, equalHistory, robustness } = results;
  const primary = compare(main.metrics.voluntree, main.metrics["fcfs-random"]);
  const lines: string[] = [];
  const push = (...text: string[]) => lines.push(...text);

  push(
    "# Voluntree baseline evaluation (FR-026)",
    "",
    "Generated by `scripts/evaluate/run.ts`. Synthetic data only. Do not edit by hand: re-run the script.",
    "",
    `- Main seed: **${main.seed}**; 100 students, 20 missions, interest probability 0.35, 5 gated missions.`,
    "- Methods: **Voluntree** (the DEC-036 matching engine, unchanged), **FCFS-random** (primary baseline) and **FCFS-engaged** (sensitivity check only).",
    "- Every method gets the same students, missions, interest, eligibility rules and capacity. Only the order in which the eligible, interested students get the slots differs.",
    "- Method, assumptions and metric definitions: `scripts/evaluate/README.md`.",
    `- "Equal" means within ${TOLERANCE.index} for 0–1 indexes, ${TOLERANCE.percent} percentage points for percentages, and exactly equal for whole-number counts.`,
    "- **Matching weights actually used:** the database has no proximity data, so the proximity factor is left out and the engine re-normalizes the DEC-036 base weights (35 / 20 / 10 / 5, unchanged). The weights in effect are **skill 35/60 (58.3%), opportunity balance 20/60 (33.3%) and reliability 5/60 (8.3%)**.",
    "- **Supplementary rows** count only the common eligible-and-interested population: students who wanted at least one mission and passed every filter for it before any allocation. It is the same group for every method. The all-student rows are kept for comparison.",
    "",
    "## 1. Main comparison: Voluntree vs FCFS-random",
    "",
    ...comparisonTable(primary, "FCFS-random"),
    "",
    "### Where FCFS-random is equal or better",
    "",
    ...equalOrBetterList(primary),
    "",
    "## 2. Sensitivity check: Voluntree vs FCFS-engaged",
    "",
    "FCFS-engaged gives each past participation a 0.05 head start on a 0–1 random arrival score, capped at 0.25. It models experienced students signing up a little faster. It is a sensitivity check, not the primary baseline.",
    "",
    ...comparisonTable(compare(main.metrics.voluntree, main.metrics["fcfs-engaged"]), "FCFS-engaged"),
    "",
    "## 3. Gated missions",
    "",
    `Share of missions that are gated: **${format("percent", main.metrics.voluntree.gatedMissionShare)}**.`,
    "",
    "- **Criteria-eligible**: students who meet the school/CGPA criteria, whatever their interest.",
    "- **Initial candidates**: students who want the mission and pass every filter before any allocation. The same for all methods.",
    "- **Pool at allocation**: the candidate pool when the method allocated the mission. It can differ between methods, because earlier placements create time conflicts.",
    "",
    "| Mission | Criteria | Slots | Criteria-eligible | Initial candidates | Method | Pool at allocation | Placed | New volunteers among placed | New volunteers among initial candidates |",
    "|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const g of main.metrics.voluntree.gated) {
    for (const method of ["voluntree", "fcfs-random"] as Method[]) {
      const row = main.metrics[method].gated.find((x) => x.missionId === g.missionId)!;
      push(
        `| ${g.missionId} | ${g.criteria} | ${g.slots} | ${g.criteriaEligible} | ${g.initialCandidates} | ${methodName(method)} | ${row.candidatePoolAtAllocation} | ${row.placed} | ${format("percent", row.newVolunteerShareOfPlaced)} | ${format("percent", row.newVolunteerShareOfCandidates)} |`,
      );
    }
  }

  push(
    "",
    "## 4. Distributions and group differences",
    "",
    "### Students by number of new placements",
    "",
    "| New placements | Voluntree | FCFS-random | FCFS-engaged |",
    "|---|---|---|---|",
  );
  for (const key of ["0", "1", "2", "3+"] as const) {
    push(`| ${key} | ${distributionCells(main, (m) => m.newDistribution[key])} |`);
  }
  push(
    "",
    "### Students by history + new placements (the admin overview buckets, DEC-027)",
    "",
    "| Total | Voluntree | FCFS-random | FCFS-engaged |",
    "|---|---|---|---|",
  );
  for (const key of ["0", "1–2", "3–5", "6+"] as const) {
    push(`| ${key} | ${distributionCells(main, (m) => m.combinedDistribution[key])} |`);
  }
  push(
    "",
    "### Mean new placements by school (SRS §9 group differences)",
    "",
    "| School | Voluntree | FCFS-random | FCFS-engaged |",
    "|---|---|---|---|",
  );
  for (const school of ["SBSS", "SEHS", "SCI", "CFGS", "LC"] as const) {
    push(`| ${school} | ${distributionCells(main, (m) => m.meanNewBySchool[school], 2)} |`);
  }

  push("", `## 5. Robustness: ${robustness.length} more seeds (Voluntree vs FCFS-random)`, "");
  push(
    `Seeds ${robustness[0].seed} to ${robustness[robustness.length - 1].seed}, same settings. Difference = Voluntree − FCFS-random; percentage differences are in percentage points (pp).`,
    "",
    "| Metric | Voluntree mean | FCFS-random mean | Difference min | Difference mean | Difference max | Voluntree better | Equal | FCFS better |",
    "|---|---|---|---|---|---|---|---|---|",
  );
  for (const row of ROWS.filter((r) => r.better !== "none")) {
    const values = robustness.map((r) => ({
      v: row.value(r.metrics.voluntree),
      b: row.value(r.metrics["fcfs-random"]),
    }));
    const diffs = values.map((x) => x.v - x.b);
    const verdicts = values.map((x) => verdict(row.kind, row.better, x.v, x.b));
    const count = (target: Verdict) => verdicts.filter((x) => x === target).length;
    // Means of counts can be fractional, so counts are shown with 2 decimals here.
    const fmt = (n: number) => (row.kind === "count" ? n.toFixed(2) : format(row.kind, n));
    push(
      `| ${row.label} | ${fmt(meanOf(values.map((x) => x.v)))} | ${fmt(meanOf(values.map((x) => x.b)))} | ${formatDifference(row.kind, Math.min(...diffs))} | ${formatDifference(row.kind, meanOf(diffs))} | ${formatDifference(row.kind, Math.max(...diffs))} | ${count("Voluntree better")} | ${count("Equal")} | ${count("FCFS better")} |`,
    );
  }

  const equal = compare(equalHistory.metrics.voluntree, equalHistory.metrics["fcfs-random"]);
  push(
    "",
    "## 6. Equal-history scenario: everyone starts with 0 participations",
    "",
    `Same seed (${equalHistory.seed}), students, missions, interest and arrival times as the main run; only the starting history is 0 for everyone, so every student is a new volunteer with neutral reliability. This tests whether Voluntree still helps when there is no existing inequality to correct.`,
    "",
    ...comparisonTable(equal, "FCFS-random"),
    "",
    "### Where FCFS-random is equal or better (equal history)",
    "",
    ...equalOrBetterList(equal),
    "",
    "## 7. Limitations",
    "",
    "- Synthetic data with assumed distributions (README, assumptions A1–A6). It shows how the two methods behave under these assumptions; it is not evidence about real AIU students.",
    "- Everyone placed attends and is approved, and deans approve every request; no-shows and dean rejections are not modelled.",
    "- Interest is random and does not depend on history; in reality, interest and arrival speed may be linked to experience. The FCFS-engaged check shows what happens with a small, capped link.",
    "- **Interest does not depend on skills either.** Under FCFS a placed student therefore often lacks the required skills. Real students may prefer missions that match their skills, which would raise FCFS's skill-match rate, so Voluntree's lead on the two skill metrics is partly a result of this assumption and is likely overstated.",
    "- Gated candidate pools are small (often no larger than the number of slots), so the order of selection rarely matters there; gated-pool results are close, and FCFS is better on several seeds.",
    "- The Gini of new placements covers all 100 students, including those who wanted no mission they could take, so it stays high for every method.",
    "- Students with unknown availability are assumed to confirm and attend.",
    "- No proximity data exists in the database, so the engine's re-normalized weights without proximity are used (skill 35/60, opportunity balance 20/60, reliability 5/60).",
    "- Both methods use the engine's Stage 1 filters, so neither ever creates a time conflict: zero conflicts for both is the expected, correct result.",
    "",
  );
  return lines.join("\n");
}

function comparisonTable(rows: Comparison[], baselineName: string): string[] {
  return [
    `| Metric | Better when | Voluntree | ${baselineName} | Verdict | Detail |`,
    "|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.label} | ${r.better === "none" ? "—" : r.better} | ${format(r.kind, r.voluntree)} | ${format(r.kind, r.baseline)} | ${r.verdict} | ${r.note} |`,
    ),
  ];
}

function equalOrBetterList(rows: Comparison[]): string[] {
  const items = rows.filter((r) => r.verdict === "Equal" || r.verdict === "FCFS better");
  if (items.length === 0) return ["- None in this run."];
  return items.map(
    (r) => `- **${r.label}**: ${r.verdict} (Voluntree ${format(r.kind, r.voluntree)}, FCFS ${format(r.kind, r.baseline)}).${r.note ? ` ${r.note}.` : ""}`,
  );
}

function distributionCells(result: ScenarioResult, value: (m: Metrics) => number, decimals = 0): string {
  return (["voluntree", "fcfs-random", "fcfs-engaged"] as Method[])
    .map((method) => value(result.metrics[method]).toFixed(decimals))
    .join(" | ");
}

function methodName(method: Method): string {
  return method === "voluntree" ? "Voluntree" : method === "fcfs-random" ? "FCFS-random" : "FCFS-engaged";
}

function meanOf(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
