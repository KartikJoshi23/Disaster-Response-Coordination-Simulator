// ============================================================================
// NashQLearning (T10) — browser training engine
// Joint-action Q-learning with multi-start Iterated Best Response to select a
// Pareto (welfare-maximising) Nash equilibrium at each state. Also runs the
// Cooperative-Fixed, Greedy and Random baselines for the MCDM comparison.
// ============================================================================

import {
  AGENT_IDS,
  AgentId,
  LearningPoint,
  StrategyMetrics,
  StrategyName,
} from "../types";
import {
  COOPERATE_ACTION,
  DisasterEnvironment,
  N_ACTIONS,
} from "./DisasterEnvironment";
import { SeededRNG } from "../utils/poissonSampler";

const GAMMA = 0.95;
const ALPHA = 0.1;
const EPS_START = 1.0;
const EPS_END = 0.05;
const EPS_DECAY_EPISODES = 500;
const EPISODE_STEPS = 30;

/** Sparse joint Q-table per agent: key = `${state}` -> Float array length 125. */
type JointQ = Map<number, Float64Array>;

function jointIndex(a0: number, a1: number, a2: number): number {
  return a0 * N_ACTIONS * N_ACTIONS + a1 * N_ACTIONS + a2;
}

export interface TrainResult {
  curve: LearningPoint[];
  qTables: JointQ[]; // one per agent
}

export class NashQLearning {
  rng: SeededRNG;
  qTables: JointQ[]; // index by agent 0..2

  constructor(seed = 7) {
    this.rng = new SeededRNG(seed);
    this.qTables = [new Map(), new Map(), new Map()];
  }

  private getQ(agent: number, state: number): Float64Array {
    let row = this.qTables[agent].get(state);
    if (!row) {
      row = new Float64Array(N_ACTIONS * N_ACTIONS * N_ACTIONS);
      this.qTables[agent].set(state, row);
    }
    return row;
  }

  /** One IBR sweep from a starting joint action; returns a fixed point. */
  private ibrFrom(
    state: number,
    start: [number, number, number],
  ): [number, number, number] {
    let profile: [number, number, number] = [...start];
    for (let iter = 0; iter < 12; iter++) {
      let changed = false;
      for (let agent = 0; agent < 3; agent++) {
        const q = this.getQ(agent, state);
        let bestA = profile[agent];
        let bestV = -Infinity;
        for (let a = 0; a < N_ACTIONS; a++) {
          const trial: [number, number, number] = [...profile];
          trial[agent] = a;
          const v = q[jointIndex(trial[0], trial[1], trial[2])];
          if (v > bestV) {
            bestV = v;
            bestA = a;
          }
        }
        if (bestA !== profile[agent]) {
          profile[agent] = bestA;
          changed = true;
        }
      }
      if (!changed) break;
    }
    return profile;
  }

  /** Multi-start IBR -> pick the welfare-maximising (Pareto) equilibrium. */
  nashAtState(state: number): [number, number, number] {
    const starts: [number, number, number][] = [
      [0, 0, 0],
      [COOPERATE_ACTION, COOPERATE_ACTION, COOPERATE_ACTION],
      [3, 3, 3],
    ];
    let best: [number, number, number] = [0, 0, 0];
    let bestWelfare = -Infinity;
    for (const s of starts) {
      const eq = this.ibrFrom(state, s);
      const welfare =
        this.getQ(0, state)[jointIndex(eq[0], eq[1], eq[2])] +
        this.getQ(1, state)[jointIndex(eq[0], eq[1], eq[2])] +
        this.getQ(2, state)[jointIndex(eq[0], eq[1], eq[2])];
      if (welfare > bestWelfare) {
        bestWelfare = welfare;
        best = eq;
      }
    }
    return best;
  }

  private epsilon(episode: number): number {
    const t = Math.min(1, episode / EPS_DECAY_EPISODES);
    return EPS_START + (EPS_END - EPS_START) * t;
  }

  /**
   * Train for `episodes` episodes. Yields the learning curve.
   * Kept lightweight (default 400 ep) so it runs smoothly in the browser.
   */
  train(episodes = 400): TrainResult {
    const curve: LearningPoint[] = [];
    const env = new DisasterEnvironment(123);

    for (let ep = 0; ep < episodes; ep++) {
      env.reset(1000 + ep);
      const eps = this.epsilon(ep);
      let epReward = 0;
      let epCoop = 0;

      for (let step = 0; step < EPISODE_STEPS; step++) {
        const state = env.discretiseState();

        // Action selection: explore vs Nash-equilibrium exploit.
        let profile: [number, number, number];
        if (this.rng.next() < eps) {
          profile = [
            this.rng.int(N_ACTIONS),
            this.rng.int(N_ACTIONS),
            this.rng.int(N_ACTIONS),
          ];
        } else {
          profile = this.nashAtState(state);
        }

        const actions: Record<AgentId, number> = {
          Medical: profile[0],
          Rescue: profile[1],
          Logistics: profile[2],
        };
        const res = env.applyStep(actions);
        const nextState = env.discretiseState();
        const nextEq = this.nashAtState(nextState);

        // Nash-Q update per agent toward own reward + gamma * Nash value.
        const rewardArr = [
          res.rewardByAgent.Medical,
          res.rewardByAgent.Rescue,
          res.rewardByAgent.Logistics,
        ];
        for (let agent = 0; agent < 3; agent++) {
          const q = this.getQ(agent, state);
          const idx = jointIndex(profile[0], profile[1], profile[2]);
          const nextQ = this.getQ(agent, nextState);
          const nashVal = nextQ[jointIndex(nextEq[0], nextEq[1], nextEq[2])];
          q[idx] += ALPHA * (rewardArr[agent] + GAMMA * nashVal - q[idx]);
        }

        epReward += res.reward;
        epCoop += res.cooperationEvents;
      }

      curve.push({
        episode: ep,
        reward: epReward,
        cooperation: epCoop,
        epsilon: eps,
      });
    }

    return { curve, qTables: this.qTables };
  }

  /** Greedy Nash action selection for evaluation (no exploration). */
  act(state: number): Record<AgentId, number> {
    const profile = this.nashAtState(state);
    return { Medical: profile[0], Rescue: profile[1], Logistics: profile[2] };
  }
}

// ----------------------------------------------------------------------------
// Strategy rollouts for the 4-way comparison (mirrors notebook evaluation).
// ----------------------------------------------------------------------------

function rollout(
  strategy: StrategyName,
  agent: NashQLearning | null,
  episodes: number,
  rng: SeededRNG,
): StrategyMetrics {
  const env = new DisasterEnvironment(999);
  let totReward = 0;
  let totResolved = 0;
  let rtSum = 0;
  let rtCount = 0;
  let utilSum = 0;
  let fairSum = 0;
  let steps = 0;

  for (let ep = 0; ep < episodes; ep++) {
    env.reset(5000 + ep);
    for (let step = 0; step < EPISODE_STEPS; step++) {
      const state = env.discretiseState();
      let actions: Record<AgentId, number>;
      switch (strategy) {
        case "Nash Q-Learning":
          actions = agent ? agent.act(state) : randomActions(rng);
          break;
        case "Cooperative Fixed":
          actions = {
            Medical: COOPERATE_ACTION,
            Rescue: COOPERATE_ACTION,
            Logistics: COOPERATE_ACTION,
          };
          break;
        case "Greedy":
          actions = { Medical: 1, Rescue: 1, Logistics: 1 };
          break;
        default:
          actions = randomActions(rng);
      }
      const res = env.applyStep(actions);
      totReward += res.reward;
      totResolved += res.resolved;
      rtSum += res.responseTimeSum;
      rtCount += res.responseTimeCount;
      utilSum += env.utilisation();
      fairSum += env.fairness();
      steps += 1;
    }
  }

  return {
    strategy,
    reward: totReward / episodes,
    responseTime: rtCount > 0 ? rtSum / rtCount : 0,
    utilisation: utilSum / steps,
    fairness: fairSum / steps,
    resolved: totResolved / episodes,
    topsis: 0,
  };
}

function randomActions(rng: SeededRNG): Record<AgentId, number> {
  return {
    Medical: rng.int(N_ACTIONS),
    Rescue: rng.int(N_ACTIONS),
    Logistics: rng.int(N_ACTIONS),
  };
}

/** Evaluate all four strategies and return their raw metrics. */
export function evaluateStrategies(
  agent: NashQLearning,
  episodes = 40,
): StrategyMetrics[] {
  const rng = new SeededRNG(2024);
  return [
    rollout("Nash Q-Learning", agent, episodes, rng),
    rollout("Cooperative Fixed", null, episodes, rng),
    rollout("Greedy", null, episodes, rng),
    rollout("Random", null, episodes, rng),
  ];
}

export { AGENT_IDS };
