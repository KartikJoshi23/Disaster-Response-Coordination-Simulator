// ============================================================================
// DisasterEnvironment (TypeScript port of the notebook's Python class)
// 5x5 grid (25 zones), 5 phases, Poisson incident arrivals, congestion/synergy
// step model and a discretised 75-state representation for the Nash-Q agents.
// ============================================================================

import {
  AGENT_IDS,
  AgentId,
  Calibration,
  DEFAULT_ENV_CONFIG,
  EnvConfig,
  EnvSnapshot,
  Incident,
  Phase,
  PHASES,
  ZoneState,
} from "../types";
import {
  clamp,
  jainFairness,
  samplePoisson,
  SeededRNG,
} from "../utils/poissonSampler";

export const GRID_SIZE = 5;
export const GRID_CELLS = GRID_SIZE * GRID_SIZE; // 25 zones
export const N_ACTIONS = 5; // 0..3 = dispatch to zone-bucket, 4 = COOPERATE
export const COOPERATE_ACTION = 4;
export const MAX_SEVERITY = 5;
export const COOP_WORTH_SEV = 5.0; // synergy only pays on severe zones
export const PHASE_LENGTH = 6; // steps per phase before advancing

/** Calibration values lifted from the notebook (FEMA + 911 derived). */
export const CALIBRATION: Calibration = {
  lambda: { Medical: 4.513, Rescue: 1.365, Logistics: 3.123 },
  budget: { Medical: 26.0, Rescue: 10.0, Logistics: 98.0 },
  programActivation: { Medical: 0.26, Rescue: 0.01, Logistics: 0.98 },
};

/** Phase-dependent intensity multipliers applied to the base lambda. */
const PHASE_INTENSITY: Record<Phase, number> = {
  Onset: 0.6,
  Escalation: 1.1,
  Peak: 1.6,
  Stabilisation: 0.9,
  Recovery: 0.4,
};

export interface StepResult {
  reward: number;
  rewardByAgent: Record<AgentId, number>;
  resolved: number;
  cooperationEvents: number;
  responseTimeSum: number;
  responseTimeCount: number;
}

export class DisasterEnvironment {
  rng: SeededRNG;
  step = 0;
  phaseIndex = 0;
  incidents: Incident[] = [];
  budgets: Record<AgentId, number>;
  cumulativeReward = 0;
  totalResolved = 0;
  cooperationEvents = 0;
  responseTimeSum = 0;
  responseTimeCount = 0;
  lastActions: Record<AgentId, number> = { Medical: 0, Rescue: 0, Logistics: 0 };
  lastReward = 0;
  resolvedThisStep = 0;
  config: EnvConfig;

  constructor(seed = 42, config: EnvConfig = DEFAULT_ENV_CONFIG) {
    this.rng = new SeededRNG(seed);
    this.config = { ...config };
    this.budgets = this.scaledBudgets();
  }

  get phase(): Phase {
    return PHASES[this.phaseIndex];
  }

  /** Starting budgets after applying the resource-availability knob. */
  private scaledBudgets(): Record<AgentId, number> {
    return {
      Medical: CALIBRATION.budget.Medical * this.config.resourceScale,
      Rescue: CALIBRATION.budget.Rescue * this.config.resourceScale,
      Logistics: CALIBRATION.budget.Logistics * this.config.resourceScale,
    };
  }

  /** Update scenario knobs (applied on the next reset). */
  configure(config: Partial<EnvConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Reset to a fresh episode. */
  reset(seed?: number): EnvSnapshot {
    if (seed !== undefined) this.rng.reseed(seed);
    this.step = 0;
    this.phaseIndex = 0;
    this.incidents = [];
    this.budgets = this.scaledBudgets();
    this.cumulativeReward = 0;
    this.totalResolved = 0;
    this.cooperationEvents = 0;
    this.responseTimeSum = 0;
    this.responseTimeCount = 0;
    this.lastReward = 0;
    this.resolvedThisStep = 0;
    this.spawnIncidents();
    return this.snapshot();
  }

  /** Poisson arrivals for the current phase, one stream per agency. */
  private spawnIncidents(): void {
    const intensity = PHASE_INTENSITY[this.phase];
    for (const agent of AGENT_IDS) {
      const lam = CALIBRATION.lambda[agent] * intensity;
      const count = Math.min(samplePoisson(lam, this.rng), 6);
      for (let i = 0; i < count; i++) {
        // Base severity 1..5 scaled by the disaster-intensity knob (capped 1..10).
        const baseSeverity = 1 + this.rng.int(MAX_SEVERITY);
        const severity = clamp(
          Math.round(baseSeverity * this.config.severityScale),
          1,
          2 * MAX_SEVERITY,
        );
        this.incidents.push({
          zone: this.rng.int(GRID_CELLS),
          type: agent,
          severity,
          age: 0,
        });
      }
    }
  }

  /**
   * Discretise full state to one of 75 buckets:
   * 5 phases x 3 resource-pressure levels x 5 load buckets.
   */
  discretiseState(): number {
    const totalBudget =
      this.budgets.Medical + this.budgets.Rescue + this.budgets.Logistics;
    const start = this.scaledBudgets();
    const baseBudget = start.Medical + start.Rescue + start.Logistics;
    const pressure = baseBudget === 0 ? 1 : 1 - totalBudget / baseBudget; // 0..1
    const pBucket = pressure < 0.33 ? 0 : pressure < 0.66 ? 1 : 2;

    const load = this.incidents.reduce((a, b) => a + b.severity, 0);
    const lBucket = Math.min(4, Math.floor(load / 8));

    return this.phaseIndex * 15 + pBucket * 5 + lBucket;
  }

  /**
   * Apply a joint action and advance one step.
   * Action per agent: 0..3 selects a zone-pressure bucket to serve,
   * 4 = COOPERATE (pool effort on the highest-severity contested zone).
   */
  applyStep(actions: Record<AgentId, number>): StepResult {
    this.lastActions = { ...actions };
    const rewardByAgent: Record<AgentId, number> = {
      Medical: 0,
      Rescue: 0,
      Logistics: 0,
    };
    let resolved = 0;
    let cooperationEvents = 0;
    let responseTimeSum = 0;
    let responseTimeCount = 0;

    // Track which agents target which zone for congestion/synergy.
    const zoneResponders: Map<number, AgentId[]> = new Map();
    const cooperators: AgentId[] = [];

    // Age all active incidents one tick at the start of the step (mirrors the
    // notebook's zone_age increment), so a zone cleared this step is credited a
    // response time of at least 1 — never zero.
    for (const inc of this.incidents) inc.age += 1;

    // Sort incidents by severity (desc) so dispatch prioritises worst zones.
    const sorted = [...this.incidents].sort((a, b) => b.severity - a.severity);

    for (const agent of AGENT_IDS) {
      const action = actions[agent];
      if (this.budgets[agent] <= 0) continue;

      if (action === COOPERATE_ACTION) {
        cooperators.push(agent);
        continue;
      }

      // Pick a target incident matching this agent's bucket preference.
      const target = this.pickTarget(sorted, agent, action);
      if (!target) continue;

      const arr = zoneResponders.get(target.zone) ?? [];
      arr.push(agent);
      zoneResponders.set(target.zone, arr);

      // Effort applied; congestion penalty if zone already crowded.
      const crowd = arr.length;
      const effectiveness = crowd === 1 ? 1.0 : 1.0 / crowd; // diminishing returns
      const effort = Math.min(this.budgets[agent], target.severity);
      this.budgets[agent] -= effort * 0.5;

      const gain = effort * effectiveness;
      rewardByAgent[agent] += gain;

      if (gain >= target.severity * 0.8) {
        resolved += 1;
        responseTimeSum += target.age;
        responseTimeCount += 1;
        target.severity = 0; // mark resolved
      } else {
        target.severity = Math.max(0, target.severity - gain);
      }
    }

    // Cooperative synergy: 2+ cooperators concentrate on the worst severe zone.
    if (cooperators.length >= 2) {
      const severe = sorted.find((inc) => inc.severity >= COOP_WORTH_SEV);
      if (severe) {
        cooperationEvents += 1;
        const synergy =
          severe.severity *
          (1 + 0.35 * cooperators.length * this.config.cooperationIncentive);
        for (const agent of cooperators) {
          this.budgets[agent] -= 1.0;
          rewardByAgent[agent] += synergy / cooperators.length;
        }
        resolved += 1;
        responseTimeSum += severe.age;
        responseTimeCount += 1;
        severe.severity = 0;
      } else {
        // Cooperating on mild zones is wasteful — small penalty.
        for (const agent of cooperators) rewardByAgent[agent] -= 0.5;
      }
    }

    // Remove resolved incidents (survivors were already aged at step start).
    this.incidents = this.incidents.filter((inc) => inc.severity > 0);

    // Advance phase / spawn new arrivals.
    this.step += 1;
    if (this.step % PHASE_LENGTH === 0 && this.phaseIndex < PHASES.length - 1) {
      this.phaseIndex += 1;
    }
    this.spawnIncidents();

    const reward =
      rewardByAgent.Medical + rewardByAgent.Rescue + rewardByAgent.Logistics;
    this.lastReward = reward;
    this.cumulativeReward += reward;
    this.resolvedThisStep = resolved;
    this.totalResolved += resolved;
    this.cooperationEvents += cooperationEvents;
    this.responseTimeSum += responseTimeSum;
    this.responseTimeCount += responseTimeCount;

    return {
      reward,
      rewardByAgent,
      resolved,
      cooperationEvents,
      responseTimeSum,
      responseTimeCount,
    };
  }

  /** Choose an incident for an agent given its action bucket. */
  private pickTarget(
    sorted: Incident[],
    agent: AgentId,
    action: number,
  ): Incident | null {
    // action 0 = own-type priority, 1 = any high severity,
    // 2 = own-type low severity, 3 = nearest fresh.
    const candidates = sorted.filter((inc) => inc.severity > 0);
    if (candidates.length === 0) return null;

    if (action === 0) {
      return (
        candidates.find((inc) => inc.type === agent) ?? candidates[0] ?? null
      );
    }
    if (action === 1) {
      return candidates[0] ?? null;
    }
    if (action === 2) {
      const own = candidates.filter((inc) => inc.type === agent);
      return own[own.length - 1] ?? candidates[candidates.length - 1] ?? null;
    }
    // action 3: freshest (lowest age)
    return (
      [...candidates].sort((a, b) => a.age - b.age)[0] ?? candidates[0] ?? null
    );
  }

  /** Build a UI snapshot of the current grid. */
  snapshot(): EnvSnapshot {
    const zones: ZoneState[] = [];
    for (let i = 0; i < GRID_CELLS; i++) {
      zones.push({
        index: i,
        row: Math.floor(i / GRID_SIZE),
        col: i % GRID_SIZE,
        load: 0,
        dominantType: null,
        responders: [],
      });
    }
    const typeCount: Record<number, Record<AgentId, number>> = {};
    for (const inc of this.incidents) {
      const z = zones[inc.zone];
      z.load += inc.severity;
      typeCount[inc.zone] = typeCount[inc.zone] ?? {
        Medical: 0,
        Rescue: 0,
        Logistics: 0,
      };
      typeCount[inc.zone][inc.type] += inc.severity;
    }
    for (const z of zones) {
      const tc = typeCount[z.index];
      if (tc) {
        let best: AgentId = "Medical";
        let bestV = -1;
        for (const a of AGENT_IDS) {
          if (tc[a] > bestV) {
            bestV = tc[a];
            best = a;
          }
        }
        z.dominantType = best;
      }
    }

    return {
      step: this.step,
      phase: this.phase,
      zones,
      incidents: [...this.incidents],
      budgets: { ...this.budgets },
      lastReward: this.lastReward,
      cumulativeReward: this.cumulativeReward,
      cooperationEvents: this.cooperationEvents,
      resolvedThisStep: this.resolvedThisStep,
      totalResolved: this.totalResolved,
      avgResponseTime: this.avgResponseTime(),
      actions: { ...this.lastActions },
    };
  }

  /** Mean age-at-resolution across the episode (the response-time metric). */
  avgResponseTime(): number {
    return this.responseTimeCount > 0
      ? this.responseTimeSum / this.responseTimeCount
      : 0;
  }

  /** Jain fairness over remaining-budget usage (lower-skew = fairer). */
  fairness(): number {
    const start = this.scaledBudgets();
    const used = AGENT_IDS.map((a) => start[a] - this.budgets[a]);
    return jainFairness(used);
  }

  /** Current resource utilisation share (0..1). */
  utilisation(): number {
    const start = this.scaledBudgets();
    const used = AGENT_IDS.reduce((acc, a) => acc + (start[a] - this.budgets[a]), 0);
    const base = start.Medical + start.Rescue + start.Logistics;
    return Math.max(0, Math.min(1, base === 0 ? 0 : used / base));
  }
}
