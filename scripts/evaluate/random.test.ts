import { describe, expect, it } from "vitest";
import { createRandom } from "./random";

describe("createRandom (mulberry32)", () => {
  it("gives the same sequence for the same seed", () => {
    const a = createRandom(20261028);
    const b = createRandom(20261028);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });

  it("gives a different sequence for a different seed", () => {
    const a = createRandom(20261028);
    const b = createRandom(20261029);
    expect(Array.from({ length: 5 }, () => a.next())).not.toEqual(Array.from({ length: 5 }, () => b.next()));
  });

  it("keeps next() in [0, 1) and int() within its bounds, reaching both ends", () => {
    const random = createRandom(1);
    const ints = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const x = random.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      const n = random.int(3, 8);
      expect(Number.isInteger(n) && n >= 3 && n <= 8).toBe(true);
      ints.add(n);
    }
    expect([...ints].sort()).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it("rounds decimal() and keeps it in range", () => {
    const random = createRandom(2);
    for (let i = 0; i < 500; i++) {
      const x = random.decimal(2, 4, 2);
      expect(x).toBeGreaterThanOrEqual(2);
      expect(x).toBeLessThanOrEqual(4);
      expect(Math.round(x * 100) / 100).toBe(x);
    }
  });

  it("chance() follows the probability roughly and is 0 or 1 at the ends", () => {
    const random = createRandom(3);
    const hits = Array.from({ length: 10000 }, () => random.chance(0.35)).filter(Boolean).length;
    expect(hits / 10000).toBeGreaterThan(0.33);
    expect(hits / 10000).toBeLessThan(0.37);
    expect(random.chance(0)).toBe(false);
    expect(random.chance(1)).toBe(true);
  });

  it("shuffle() returns a permutation and leaves the input unchanged", () => {
    const random = createRandom(4);
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
    const output = random.shuffle(input);
    expect([...output].sort()).toEqual([...input]);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("rejects a non-integer seed", () => {
    expect(() => createRandom(1.5)).toThrow(RangeError);
  });
});
