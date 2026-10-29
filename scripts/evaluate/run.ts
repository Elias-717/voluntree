// Entry point of the baseline evaluation (FR-026).
// Run: npm run evaluate   (or npx tsx scripts/evaluate/run.ts)
// Evaluates both configurations (live and future), prints the report and writes
// scripts/evaluate/results.md. Same numbers on every run.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { METHODS, allocate, type Method } from "./allocate";
import { applyConfiguration, generateScenario, type Configuration, type ScenarioOptions } from "./generate";
import { computeMetrics, populations, type Metrics } from "./metrics";
import { buildReport, type ConfigurationResults, type EvaluationResults, type ScenarioResult } from "./report";

export const MAIN_SEED = 20261028;
export const ROBUSTNESS_SEEDS = Array.from({ length: 10 }, (_, i) => MAIN_SEED + 1 + i);

export function runScenario(
  seed: number,
  label: string,
  options: Partial<ScenarioOptions> = {},
  configuration: Configuration = "future",
): ScenarioResult {
  // The same generated scenario for both configurations; only the configuration is applied on top.
  const scenario = applyConfiguration(generateScenario(seed, options), configuration);
  const pops = populations(scenario);
  const metrics = Object.fromEntries(
    METHODS.map((method) => [method, computeMetrics(scenario, allocate(scenario, method), pops)]),
  ) as Record<Method, Metrics>;
  return { label, seed, populations: pops, metrics };
}

export function runConfiguration(configuration: Configuration): ConfigurationResults {
  return {
    configuration,
    main: runScenario(MAIN_SEED, "main", {}, configuration),
    equalHistory: runScenario(MAIN_SEED, "equal history", { history: "equal" }, configuration),
    robustness: ROBUSTNESS_SEEDS.map((seed) => runScenario(seed, `seed ${seed}`, {}, configuration)),
  };
}

export function runEvaluation(): EvaluationResults {
  return { live: runConfiguration("live"), future: runConfiguration("future") };
}

// Only runs when this file is executed directly, not when tests import it.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = buildReport(runEvaluation());
  writeFileSync(new URL("./results.md", import.meta.url), report);
  console.log(report);
}
