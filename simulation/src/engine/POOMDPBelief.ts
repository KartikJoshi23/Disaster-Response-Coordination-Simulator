// ============================================================================
// POOMDPBelief (T8) — Bayesian belief filtering over hidden zone severity
// Exact discrete Bayes update plus a small particle filter, used to illustrate
// decision-making under partial observability (noisy severity sensors).
// ============================================================================

import { BeliefStep } from "../types";
import { SeededRNG } from "../utils/poissonSampler";

export const SEVERITY_LEVELS = 5; // hidden states: severity 1..5
const OBS_NOISE = 0.2; // probability mass spread to neighbouring readings

/** Observation model P(obs | trueLevel) — peaked at the true level. */
function observationLikelihood(obs: number, level: number): number {
  const d = Math.abs(obs - level);
  if (d === 0) return 1 - OBS_NOISE;
  if (d === 1) return OBS_NOISE / 2;
  return OBS_NOISE / 6;
}

/** Normalise a vector to a probability distribution. */
function normalise(v: number[]): number[] {
  const s = v.reduce((a, b) => a + b, 0);
  return s === 0 ? v.map(() => 1 / v.length) : v.map((x) => x / s);
}

export interface BeliefRun {
  steps: BeliefStep[];
  finalBelief: number[];
  trueLevel: number;
  modeCorrect: boolean;
}

/**
 * Run the exact Bayesian filter for `nObs` noisy observations of a fixed
 * hidden severity level. Returns the belief trajectory for plotting.
 */
export function runBeliefFilter(trueLevel = 3, nObs = 8, seed = 17): BeliefRun {
  const rng = new SeededRNG(seed);
  let belief = new Array(SEVERITY_LEVELS).fill(1 / SEVERITY_LEVELS);
  const steps: BeliefStep[] = [];

  steps.push({
    step: 0,
    belief: [...belief],
    observation: 0,
    trueState: trueLevel,
  });

  for (let t = 1; t <= nObs; t++) {
    // Sample a noisy observation around the true level.
    const roll = rng.next();
    let obs = trueLevel;
    if (roll < OBS_NOISE / 2) obs = Math.max(1, trueLevel - 1);
    else if (roll < OBS_NOISE) obs = Math.min(SEVERITY_LEVELS, trueLevel + 1);

    // Bayes update: posterior ∝ likelihood × prior.
    belief = normalise(
      belief.map(
        (p, i) => p * observationLikelihood(obs, i + 1),
      ),
    );

    steps.push({
      step: t,
      belief: [...belief],
      observation: obs,
      trueState: trueLevel,
    });
  }

  const mode = belief.indexOf(Math.max(...belief)) + 1;
  return {
    steps,
    finalBelief: belief,
    trueLevel,
    modeCorrect: mode === trueLevel,
  };
}

/**
 * Lightweight particle filter (N particles) returning an approximate posterior
 * — included to mirror the notebook's particle-filter cross-check.
 */
export function particleFilter(
  trueLevel = 3,
  nObs = 8,
  nParticles = 100,
  seed = 23,
): number[] {
  const rng = new SeededRNG(seed);
  let particles = Array.from({ length: nParticles }, () =>
    1 + rng.int(SEVERITY_LEVELS),
  );

  for (let t = 0; t < nObs; t++) {
    const roll = rng.next();
    let obs = trueLevel;
    if (roll < OBS_NOISE / 2) obs = Math.max(1, trueLevel - 1);
    else if (roll < OBS_NOISE) obs = Math.min(SEVERITY_LEVELS, trueLevel + 1);

    const weights = particles.map((p) => observationLikelihood(obs, p));
    const resampled: number[] = [];
    for (let i = 0; i < nParticles; i++) {
      resampled.push(particles[rng.choice(weights)]);
    }
    particles = resampled;
  }

  const hist = new Array(SEVERITY_LEVELS).fill(0);
  for (const p of particles) hist[p - 1] += 1;
  return normalise(hist);
}
