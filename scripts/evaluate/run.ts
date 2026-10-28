// Entry point of the baseline evaluation (FR-026).
// Run: npx tsx scripts/evaluate/run.ts   (later: npm run evaluate, once Elias adds it)
// Prints the report and writes scripts/evaluate/results.md. Same numbers on every run.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { METHODS, allocate, type Method } from "./allocate";
import { generateScenario, type ScenarioOptions } from "./generate";
import { computeMetrics, populations, type Metrics } from "./metrics";
import { buildReport, type EvaluationResults, type ScenarioResult } from "./report";

export const MAIN_SEED = 20261028;
export const ROBUSTNESS_SEEDS = Array.from({ length: 10 }, (_, i) => MAIN_SEED + 1 + i);

export function runScenario(seed: number, label: string, options: Partial<ScenarioOptions> = {}): ScenarioResult {
  const scenario = generateScenario(seed, options);
  const pops = populations(scenario);
  const metrics = Object.fromEntries(
    METHODS.map((method) => [method, computeMetrics(scenario, allocate(scenario, method), pops)]),
  ) as Record<Method, Metrics>;
  return { label, seed, populations: pops, metrics };
}

export function runEvaluation(): EvaluationResults {
  return {
    main: runScenario(MAIN_SEED, "main"),
    equalHistory: runScenario(MAIN_SEED, "equal history", { history: "equal" }),
    robustness: ROBUSTNESS_SEEDS.map((seed) => runScenario(seed, `seed ${seed}`)),
  };
}

// Only runs when this file is executed directly, not when tests import it.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = buildReport(runEvaluation());
  writeFileSync(new URL("./results.md", import.meta.url), report);
  console.log(report);
}
