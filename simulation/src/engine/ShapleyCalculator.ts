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
 * Characteristic function v(S): value created by a coalition S of agencies.
 * Reflects the notebook's calibration — Logistics dominates (PA 98% activation),
 * and cooperation produces super-additive value (synergy) for severe events.
 */
export function coalitionValue(members: AgentId[]): number {
  const base: Record<AgentId, number> = {
    Medical: 6.5,
    Rescue: 3.2,
    Logistics: 17.0,
  };
  let v = members.reduce((acc, m) => acc + base[m], 0);
  // Super-additive synergy when 2+ agencies cooperate.
  if (members.length >= 2) v += 1.6 * (members.length - 1);
  if (members.length === 3) v += 1.4; // full-coalition coordination bonus
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
