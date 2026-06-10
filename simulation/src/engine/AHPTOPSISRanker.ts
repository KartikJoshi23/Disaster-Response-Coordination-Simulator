// ============================================================================
// AHPTOPSISRanker (T11) — Multi-criteria decision analysis
// AHP eigenvector weights (with consistency ratio) over four criteria, then
// TOPSIS closeness-coefficient ranking of the four candidate strategies.
// ============================================================================

import { AHPResult, StrategyMetrics } from "../types";

const CRITERIA = ["ResponseTime", "Utilisation", "Fairness", "Resolved"];

// Random Index (Saaty) for n=4.
const RANDOM_INDEX_4 = 0.9;

/**
 * Expert pairwise comparison matrix (Saaty scale).
 * Response time and fairness are co-primary (fairness = project theme),
 * giving a near-consistent matrix with CR well below 0.1.
 */
const PAIRWISE: number[][] = [
  [1, 3, 1, 3],
  [1 / 3, 1, 1 / 3, 1],
  [1, 3, 1, 3],
  [1 / 3, 1, 1 / 3, 1],
];

/** Principal eigenvector via power iteration. */
function principalEigen(matrix: number[][]): { vector: number[]; lambda: number } {
  const n = matrix.length;
  let v = new Array(n).fill(1 / n);
  let lambda = 0;
  for (let iter = 0; iter < 200; iter++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) next[i] += matrix[i][j] * v[j];
    }
    const sum = next.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) next[i] /= sum;
    const diff = next.reduce((a, b, i) => a + Math.abs(b - v[i]), 0);
    v = next;
    if (diff < 1e-10) break;
  }
  // Estimate lambda_max = average of (Av)_i / v_i.
  const av = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) av[i] += matrix[i][j] * v[j];
  lambda = av.reduce((a, b, i) => a + b / v[i], 0) / n;
  return { vector: v, lambda };
}

export function ahpWeights(): AHPResult {
  const { vector, lambda } = principalEigen(PAIRWISE);
  const n = PAIRWISE.length;
  const ci = (lambda - n) / (n - 1);
  const cr = ci / RANDOM_INDEX_4;
  return {
    weights: vector,
    criteria: CRITERIA,
    cr: Math.max(0, cr),
    consistent: cr < 0.1,
  };
}

/**
 * TOPSIS ranking. ResponseTime is a cost criterion (lower better);
 * the rest are benefit criteria (higher better).
 */
export function topsisRank(
  metrics: StrategyMetrics[],
  weights: number[],
): StrategyMetrics[] {
  // Build decision matrix: columns = [responseTime, utilisation, fairness, resolved]
  const matrix = metrics.map((m) => [
    m.responseTime,
    m.utilisation,
    m.fairness,
    m.resolved,
  ]);
  const cols = 4;
  const isCost = [true, false, false, false];

  // Vector normalisation.
  const norms = new Array(cols).fill(0);
  for (let j = 0; j < cols; j++) {
    norms[j] = Math.sqrt(matrix.reduce((acc, row) => acc + row[j] * row[j], 0));
    if (norms[j] === 0) norms[j] = 1;
  }
  const weighted = matrix.map((row) =>
    row.map((x, j) => (x / norms[j]) * weights[j]),
  );

  // Ideal best / worst.
  const ideal = new Array(cols).fill(0);
  const anti = new Array(cols).fill(0);
  for (let j = 0; j < cols; j++) {
    const col = weighted.map((r) => r[j]);
    if (isCost[j]) {
      ideal[j] = Math.min(...col);
      anti[j] = Math.max(...col);
    } else {
      ideal[j] = Math.max(...col);
      anti[j] = Math.min(...col);
    }
  }

  // Closeness coefficient.
  const result = metrics.map((m, i) => {
    const dPlus = Math.sqrt(
      weighted[i].reduce((acc, x, j) => acc + (x - ideal[j]) ** 2, 0),
    );
    const dMinus = Math.sqrt(
      weighted[i].reduce((acc, x, j) => acc + (x - anti[j]) ** 2, 0),
    );
    const c = dPlus + dMinus === 0 ? 0 : dMinus / (dPlus + dMinus);
    return { ...m, topsis: c };
  });

  return result.sort((a, b) => b.topsis - a.topsis);
}
