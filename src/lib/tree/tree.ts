// Growing tree (FR-027, DEC-006).
// The stage comes from the student's net watering count: a new stage every 3 waterings.

/** Waterings needed to move up one stage. A configuration value (DEC-006). */
export const WATERINGS_PER_STAGE = 3;

/** The five stages, in growth order. */
export const TREE_STAGES = [
  "seed",
  "sprout",
  "sapling",
  "young-tree",
  "full-tree",
] as const;

export type TreeStage = (typeof TREE_STAGES)[number];

export interface TreeStageInfo {
  stage: TreeStage;
  /** Public path of the stage SVG, e.g. "/tree/sapling.svg". */
  imagePath: string;
  /** Waterings still needed for the next stage. null when the tree is full. */
  wateringsToNextStage: number | null;
}

export function getTreeStage(wateringCount: number): TreeStageInfo {
  // Number.isInteger is false for 2.5, NaN and Infinity.
  if (!Number.isInteger(wateringCount) || wateringCount < 0) {
    throw new RangeError(
      `Watering count must be a whole number, 0 or more. Received: ${wateringCount}`,
    );
  }

  const lastIndex = TREE_STAGES.length - 1;
  // After the last stage the tree stays full while waterings keep counting.
  const index = Math.min(Math.floor(wateringCount / WATERINGS_PER_STAGE), lastIndex);
  const stage = TREE_STAGES[index];

  const wateringsToNextStage =
    index === lastIndex ? null : (index + 1) * WATERINGS_PER_STAGE - wateringCount;

  return { stage, imagePath: `/tree/${stage}.svg`, wateringsToNextStage };
}
