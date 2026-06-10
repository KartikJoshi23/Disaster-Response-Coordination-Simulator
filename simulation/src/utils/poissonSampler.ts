// ============================================================================
// Seeded RNG + Knuth Poisson sampler
// Deterministic, reproducible randomness so the in-browser simulation matches
// across runs (mirrors numpy's seeded generator used in the notebook).
// ============================================================================

/**
 * Mulberry32 — a small, fast, deterministic 32-bit PRNG.
 * Given the same seed it always yields the same stream of floats in [0,1).
 */
export class SeededRNG {
  private state: number;

  constructor(seed = 42) {
    // force into uint32 range
    this.state = seed >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Sample an index from a (possibly unnormalised) weight vector. */
  choice(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return this.int(weights.length);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  /** Re-seed the stream. */
  reseed(seed: number): void {
    this.state = seed >>> 0;
  }
}

/**
 * Knuth's algorithm for sampling from a Poisson(lambda) distribution.
 * Used to generate stochastic incident arrivals per phase.
 */
export function samplePoisson(lambda: number, rng: SeededRNG): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng.next();
  } while (p > L);
  return k - 1;
}

/** Jain's fairness index over a non-negative allocation vector. */
export function jainFairness(values: number[]): number {
  const n = values.length;
  if (n === 0) return 1;
  const sum = values.reduce((a, b) => a + b, 0);
  const sumSq = values.reduce((a, b) => a + b * b, 0);
  if (sumSq === 0) return 1;
  return (sum * sum) / (n * sumSq);
}

/** Clamp helper. */
export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
