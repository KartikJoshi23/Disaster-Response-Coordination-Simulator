import { useMemo, useState } from "react";
import { EngineResults } from "../App";
import LearningCurveChart from "./charts/LearningCurveChart";
import TOPSISChart from "./charts/TOPSISChart";
import BeliefStateChart from "./charts/BeliefStateChart";
import { runBeliefFilter } from "../engine/POOMDPBelief";
import { StrategyMetrics } from "../types";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Eye,
  LineChart,
  Scale,
  Trophy,
} from "lucide-react";

interface Props {
  results: EngineResults;
}

export default function Analytics({ results }: Props) {
  const belief = useMemo(() => runBeliefFilter(3, 8, 17), []);
  const [bStep, setBStep] = useState(belief.steps.length - 1);
  const current = belief.steps[bStep];

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h2 className="text-2xl font-bold text-gradient">Analytics</h2>
        <p className="text-sm text-[var(--muted)]">
          Learning dynamics, decision criteria and partial-observability belief
          tracking.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning curve */}
        <section className="glass rounded-2xl p-6 glass-hover">
          <h3 className="font-semibold flex items-center gap-2 mb-1">
            <LineChart size={16} className="text-[var(--accent)]" /> Nash-Q
            learning curve
          </h3>
          <p className="text-xs text-[var(--muted)] mb-3">
            Episode reward and cooperation events (moving average). Cooperation
            rises as agents discover the welfare-maximising equilibrium.
          </p>
          <LearningCurveChart data={results.curve} />
        </section>

        {/* TOPSIS */}
        <section className="glass rounded-2xl p-6 glass-hover">
          <h3 className="font-semibold flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-[var(--logistics)]" /> TOPSIS
            strategy ranking
          </h3>
          <p className="text-xs text-[var(--muted)] mb-3">
            Composite closeness coefficient over four weighted criteria.
          </p>
          <TOPSISChart metrics={results.metrics} />
        </section>
      </div>

      {/* POMDP belief */}
      <section className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Eye size={16} className="text-[var(--rescue)]" /> POMDP belief
            filtering
          </h3>
          <span className="badge">
            true severity = level {belief.trueLevel}
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mb-4">
          Bayesian posterior over hidden zone severity, updated from noisy
          sensor readings. Step through the observations to watch the belief
          concentrate on the true state.
        </p>
        <BeliefStateChart step={current} trueLevel={belief.trueLevel} />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setBStep((s) => Math.max(0, s - 1))}
            disabled={bStep === 0}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 glass glass-hover text-sm disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-[var(--muted)] font-mono">
            observation {bStep} / {belief.steps.length - 1} · last reading:{" "}
            {current.observation || "—"}
          </span>
          <button
            onClick={() =>
              setBStep((s) => Math.min(belief.steps.length - 1, s + 1))
            }
            disabled={bStep === belief.steps.length - 1}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 glass glass-hover text-sm disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* AHP weights + metrics table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="glass rounded-2xl p-6 glass-hover">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Scale size={16} className="text-[var(--accent)]" /> AHP criteria
            weights
          </h3>
          <div className="space-y-3">
            {results.ahp.criteria.map((c, i) => (
              <div key={c}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c}</span>
                  <span className="font-mono text-[var(--muted)]">
                    {(results.ahp.weights[i] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                    style={{ width: `${results.ahp.weights[i] * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-between text-xs">
            <span className="text-[var(--muted)]">Consistency Ratio</span>
            <span
              className={`font-mono ${
                results.ahp.consistent ? "text-[var(--good)]" : "text-[var(--medical)]"
              }`}
            >
              CR = {results.ahp.cr.toFixed(4)}{" "}
              {results.ahp.consistent ? "✓" : "✗"}
            </span>
          </div>
        </section>

        <section className="lg:col-span-2 glass rounded-2xl p-6 overflow-x-auto">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Brain size={16} className="text-[var(--logistics)]" /> Strategy
            metrics
          </h3>
          <MetricsTable metrics={results.metrics} />
        </section>
      </div>
    </div>
  );
}

function MetricsTable({ metrics }: { metrics: StrategyMetrics[] }) {
  const cols: { key: keyof StrategyMetrics; label: string; fmt: (n: number) => string }[] =
    [
      { key: "reward", label: "Reward", fmt: (n) => n.toFixed(2) },
      { key: "responseTime", label: "Resp.Time", fmt: (n) => n.toFixed(2) },
      { key: "utilisation", label: "Util.", fmt: (n) => n.toFixed(3) },
      { key: "fairness", label: "Fairness", fmt: (n) => n.toFixed(3) },
      { key: "resolved", label: "Resolved", fmt: (n) => n.toFixed(1) },
      { key: "topsis", label: "TOPSIS C*", fmt: (n) => n.toFixed(3) },
    ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[var(--muted)] text-xs uppercase tracking-wide">
          <th className="py-2 pr-4">Strategy</th>
          {cols.map((c) => (
            <th key={c.key} className="py-2 px-3 text-right">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {metrics.map((m, i) => (
          <tr
            key={m.strategy}
            className={`border-t border-[var(--border)] ${
              i === 0 ? "bg-[var(--accent)]/10" : ""
            }`}
          >
            <td className="py-2.5 pr-4 font-medium flex items-center gap-2">
              {i === 0 && <Trophy size={13} className="text-[var(--logistics)]" />}
              {m.strategy}
            </td>
            {cols.map((c) => (
              <td
                key={c.key}
                className="py-2.5 px-3 text-right font-mono text-[var(--text)]"
              >
                {c.fmt(m[c.key] as number)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
