// Seeded random numbers for the evaluation (FR-026).
// mulberry32: a tiny, well-known generator. The same seed always gives the same sequence,
// so every run of the evaluation produces exactly the same synthetic data.

export interface Random {
  /** A number in [0, 1). */
  next(): number;
  /** A whole number from min to max, both included. */
  int(min: number, max: number): number;
  /** A number in [min, max), rounded to the given number of decimals. */
  decimal(min: number, max: number, decimals: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
  /** A new array with the items in random order. The input is not changed. */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRandom(seed: number): Random {
  if (!Number.isInteger(seed)) {
    throw new RangeError(`Seed must be a whole number. Received: ${seed}`);
  }
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1));
  }

  return {
    next,
    int,
    decimal(min, max, decimals) {
      const factor = 10 ** decimals;
      return Math.round((min + next() * (max - min)) * factor) / factor;
    },
    chance(p) {
      return next() < p;
    },
    shuffle(items) {
      // Fisher–Yates on a copy.
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}
