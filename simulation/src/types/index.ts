// ============================================================================
// DisasterCoord AI — Shared TypeScript interfaces
// Mirrors the Python notebook classes so the browser engine reproduces the
// same multi-agent MDP / Nash-Q / Shapley / AHP-TOPSIS pipeline.
// ============================================================================

/** The three responder agencies (agents) in the cooperative game. */
export type AgentId = "Medical" | "Rescue" | "Logistics";

export const AGENT_IDS: AgentId[] = ["Medical", "Rescue", "Logistics"];

/** Disaster lifecycle phases (drives non-stationary arrival intensity). */
export type Phase = "Onset" | "Escalation" | "Peak" | "Stabilisation" | "Recovery";

export const PHASES: Phase[] = [
  "Onset",
  "Escalation",
  "Peak",
  "Stabilisation",
  "Recovery",
];

/** A single incident sitting on a grid zone awaiting response. */
export interface Incident {
  zone: number; // 0..GRID_CELLS-1
  type: AgentId; // which agency it primarily needs
  severity: number; // 1..5
  age: number; // steps since spawn (drives response-time metric)
}

/** Per-zone aggregate used for rendering the heat grid. */
export interface ZoneState {
  index: number;
  row: number;
  col: number;
  load: number; // summed severity of incidents in the zone
  dominantType: AgentId | null;
  responders: AgentId[]; // agents acting on this zone this step
}

/** Snapshot of the environment after a step — consumed by the UI. */
export interface EnvSnapshot {
  step: number;
  phase: Phase;
  zones: ZoneState[];
  incidents: Incident[];
  budgets: Record<AgentId, number>; // remaining capacity per agent
  lastReward: number;
  cumulativeReward: number;
  cooperationEvents: number;
  resolvedThisStep: number;
  totalResolved: number;
  avgResponseTime: number; // mean age-at-resolution so far (steps)
  actions: Record<AgentId, number>; // action index chosen by each agent
}

/**
 * User-tunable scenario knobs (mirrors the notebook DisasterEnvironment
 * parameters severity / budgets / coop_incentive). Defaults are all 1.0,
 * which reproduces the calibrated benchmark exactly.
 */
export interface EnvConfig {
  severityScale: number; // scales incident severity (disaster intensity)
  resourceScale: number; // scales each agency's starting budget
  cooperationIncentive: number; // scales the cooperative-synergy bonus
}

export const DEFAULT_ENV_CONFIG: EnvConfig = {
  severityScale: 1,
  resourceScale: 1,
  cooperationIncentive: 1,
};


/** Calibration constants derived from FEMA + 911 data in the notebook. */
export interface Calibration {
  lambda: Record<AgentId, number>; // Poisson arrival intensity
  budget: Record<AgentId, number>; // resource capacity
  programActivation: Record<AgentId, number>; // share of declarations
}

/** Strategy profiles compared in the MCDM ranking. */
export type StrategyName =
  | "Nash Q-Learning"
  | "Cooperative Fixed"
  | "Greedy"
  | "Random";

export const STRATEGY_NAMES: StrategyName[] = [
  "Nash Q-Learning",
  "Cooperative Fixed",
  "Greedy",
  "Random",
];

/** Metrics gathered from an evaluation rollout of a strategy. */
export interface StrategyMetrics {
  strategy: StrategyName;
  reward: number;
  responseTime: number;
  utilisation: number;
  fairness: number; // Jain's index
  resolved: number;
  topsis: number; // closeness coefficient (filled by ranker)
}

/** One training-curve datapoint. */
export interface LearningPoint {
  episode: number;
  reward: number;
  cooperation: number;
  epsilon: number;
}

/** Shapley decomposition result. */
export interface ShapleyResult {
  values: Record<AgentId, number>;
  grandValue: number;
  efficiencyOk: boolean;
  coalitionValues: { coalition: string; value: number }[];
}

/** AHP weighting result. */
export interface AHPResult {
  weights: number[]; // [responseTime, utilisation, fairness, resolved]
  criteria: string[];
  cr: number; // consistency ratio
  consistent: boolean;
}

/** Belief-state evolution for the POMDP panel. */
export interface BeliefStep {
  step: number;
  belief: number[]; // distribution over severity levels 1..5
  observation: number;
  trueState: number;
}

/** 2-player payoff bimatrix point for the Nash panel. */
export interface NashCell {
  row: number;
  col: number;
  payoffRow: number;
  payoffCol: number;
  isEquilibrium: boolean;
}
