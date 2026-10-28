import { describe, expect, it } from "vitest";
import { getTreeStage } from "./tree";

describe("getTreeStage", () => {
  it.each([
    [0, "seed", 3],
    [2, "seed", 1],
    [3, "sprout", 3],
    [6, "sapling", 3],
    [7, "sapling", 2],
    [9, "young-tree", 3],
    [11, "young-tree", 1],
    [12, "full-tree", null],
    [40, "full-tree", null],
  ])("%i waterings gives %s", (count, stage, toNext) => {
    expect(getTreeStage(count)).toEqual({
      stage,
      imagePath: `/tree/${stage}.svg`,
      wateringsToNextStage: toNext,
    });
  });

  it.each([-1, 2.5, NaN, Infinity, -Infinity])("throws a RangeError for %s", (count) => {
    expect(() => getTreeStage(count)).toThrow(RangeError);
  });
});
