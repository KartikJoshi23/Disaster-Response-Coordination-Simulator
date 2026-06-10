// ============================================================================
// ShapleyCalculator (T3) — exact 3-agent Shapley value
// Computes each agency's fair marginal contribution to coalition value, with
// the efficiency axiom check (sum of Shapley values == grand coalition value).
// ============================================================================

import { AGENT_IDS, AgentId, ShapleyResult } from "../types";

/** All permutations of [0,1,2]. */
const PERMUTATIONS: number[][] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

/**
 * Characteristic function v(S): mean incidents resolved when only the agencies
 * in coalition S are active. These are the exact Monte-Carlo coalition values
 * produced by the companion notebook (ShapleyValueCalculator, 40 episodes,
 * seed 55), so the dashboard reproduces the notebook's Shapley allocation
 * exactly: Medical −0.59, Rescue 0.27, Logistics 34.17, grand value 33.85.
 */
const COALITION_VALUES: Record<string, number> = {
  "": 0.0,
  Medical: 0.0,
  Rescue: 0.0,
  Logistics: 36.28,
  "Medical+Rescue": 1.65,
  "Logistics+Medical": 33.15,
  "Logistics+Rescue": 34.88,
  "Logistics+Medical+Rescue": 33.85,
};

/** Canonical, order-independent key for a coalition (fixed agency ordering). */
function coalitionKey(members: AgentId[]): string {
  const order: AgentId[] = ["Logistics", "Medical", "Rescue"];
  return order.filter((a) => members.includes(a)).join("+");
}

export function coalitionValue(members: AgentId[]): number {
  const key = coalitionKey(members);
  const v = COALITION_VALUES[key];
  if (v === undefined) {
    throw new Error(`Unknown coalition value for "${key}"`);
  }
  return v;
}

const KEY: AgentId[] = AGENT_IDS;

export function computeShapley(): ShapleyResult {
  const phi: Record<AgentId, number> = { Medical: 0, Rescue: 0, Logistics: 0 };

  for (const perm of PERMUTATIONS) {
    const seen: AgentId[] = [];
    for (const idx of perm) {
      const agent = KEY[idx];
      const before = coalitionValue(seen);
      const after = coalitionValue([...seen, agent]);
      phi[agent] += after - before;
      seen.push(agent);
    }
  }
  for (const a of KEY) phi[a] /= PERMUTATIONS.length;

  const grandValue = coalitionValue(KEY);
  const sumPhi = phi.Medical + phi.Rescue + phi.Logistics;
  const efficiencyOk = Math.abs(sumPhi - grandValue) < 1e-6;

  // Enumerate all coalition values for display.
  const coalitionValues: { coalition: string; value: number }[] = [];
  const subsets: AgentId[][] = [
    [],
    ["Medical"],
    ["Rescue"],
    ["Logistics"],
    ["Medical", "Rescue"],
    ["Medical", "Logistics"],
    ["Rescue", "Logistics"],
    ["Medical", "Rescue", "Logistics"],
  ];
  for (const s of subsets) {
    coalitionValues.push({
      coalition: s.length === 0 ? "∅" : s.join("+"),
      value: coalitionValue(s),
    });
  }

  return { values: phi, grandValue, efficiencyOk, coalitionValues };
}
