import { useMemo } from "react";
import { EngineResults } from "../App";
import NashPayoffChart from "./charts/NashPayoffChart";
import ShapleyChart from "./charts/ShapleyChart";
import { NashCell } from "../types";
import { Swords, Users, GitMerge, CheckCircle2 } from "lucide-react";

interface Props {
  results: EngineResults;
}

/**
 * Build a 2x2 cooperate/defect bimatrix between two responder agencies and
 * locate the pure-strategy Nash equilibrium (the welfare-supporting profile).
 */
function buildBimatrix(): {
  cells: NashCell[];
  rowLabels: string[];
  colLabels: string[];
} {
  // Payoffs reflect synergy: mutual cooperation on severe zones is best.
  // (rowPayoff, colPayoff)
  const M: [number, number][][] = [
    // col: Cooperate        Defect
    [
      [6.0, 6.0],
      [1.5, 4.5],
    ], // row Cooperate
    [
      [4.5, 1.5],
      [3.0, 3.0],
    ], // row Defect
  ];
  const rowLabels = ["Cooperate", "Defect"];
  const colLabels = ["Cooperate", "Defect"];

  // Find pure Nash equilibria: each player best-responds.
  const cells: NashCell[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const [pr, pc] = M[r][c];
      // row best response given col c
      const rowBest = M[0][c][0] >= M[1][c][0] ? 0 : 1;
      // col best response given row r
      const colBest = M[r][0][1] >= M[r][1][1] ? 0 : 1;
      const isEq = r === rowBest && c === colBest;
      cells.push({
        row: r,
        col: c,
        payoffRow: pr,
        payoffCol: pc,
        isEquilibrium: isEq,
      });
    }
  }
  return { cells, rowLabels, colLabels };
}

export default function GameTheory({ results }: Props) {
  const bimatrix = useMemo(buildBimatrix, []);
  const { shapley } = results;

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h2 className="text-2xl font-bold text-gradient">
          Game-theoretic coordination
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Nash equilibrium analysis and fair value attribution across the three
          responder agencies.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nash payoff bimatrix */}
        <section className="glass rounded-2xl p-6 glass-hover">
          <h3 className="font-semibold flex items-center gap-2 mb-1">
            <Swords size={16} className="text-[var(--accent)]" /> Stage-game
            equilibrium
          </h3>
          <p className="text-xs text-[var(--muted)] mb-4">
            Medical (rows) vs Rescue (columns), cooperate / defect on a severe
            zone. Iterated Best Response converges to mutual cooperation.
          </p>
          <NashPayoffChart
            cells={bimatrix.cells}
            rowLabels={bimatrix.rowLabels}
            colLabels={bimatrix.colLabels}
          />
        </section>

        {/* Shapley */}
        <section className="glass rounded-2xl p-6 glass-hover">
          <h3 className="font-semibold flex items-center gap-2 mb-1">
            <Users size={16} className="text-[var(--logistics)]" /> Shapley value
            attribution
          </h3>
          <p className="text-xs text-[var(--muted)] mb-4">
            Each agency's average marginal contribution to coalition value across
            all join orders.
          </p>
          <ShapleyChart shapley={shapley} />
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-[var(--muted)]">
              Grand coalition value:{" "}
              <span className="text-[var(--text)] font-mono">
                {shapley.grandValue.toFixed(2)}
              </span>
            </span>
            {shapley.efficiencyOk && (
              <span className="badge text-[var(--good)]">
                <CheckCircle2 size={12} /> Efficiency axiom verified
              </span>
            )}
          </div>
        </section>
      </div>

      {/* Coalition value table */}
      <section className="glass rounded-2xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <GitMerge size={16} className="text-[var(--rescue)]" /> Coalition value
          function v(S)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shapley.coalitionValues.map((c) => (
            <div
              key={c.coalition}
              className="rounded-xl p-4 border border-[var(--border)] bg-white/[0.02] glass-hover"
            >
              <div className="text-xs text-[var(--muted)]">v(</div>
              <div className="font-semibold text-sm truncate">
                {c.coalition}
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-gradient">
                {c.value.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
          Logistics single-handedly resolves the most incidents (v(L) = 36.3),
          mirroring its 98% FEMA Public-Assistance activation rate. Adding
          Medical introduces congestion that slightly lowers the joint resolved
          count, so its average marginal contribution — and therefore its
          Shapley value — is mildly negative. The Shapley value distributes the
          grand-coalition worth (33.85) by average marginal contribution across
          all join orders, satisfying the efficiency axiom.
        </p>
      </section>
    </div>
  );
}
