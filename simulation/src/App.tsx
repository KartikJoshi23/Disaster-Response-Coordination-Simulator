import { useEffect, useMemo, useState } from "react";
import Navbar, { PageId } from "./components/Navbar";
import Overview from "./components/Overview";
import Simulation from "./components/Simulation";
import GameTheory from "./components/GameTheory";
import Analytics from "./components/Analytics";
import Methodology from "./components/Methodology";
import {
  evaluateStrategies,
  NashQLearning,
} from "./engine/NashQLearning";
import { ahpWeights, topsisRank } from "./engine/AHPTOPSISRanker";
import { computeShapley } from "./engine/ShapleyCalculator";
import { LearningPoint, StrategyMetrics, StrategyName } from "./types";
import precomputed from "./data/precomputedQTable.json";
import { Activity } from "lucide-react";

/** Results computed once by the in-browser engine and shared across pages. */
export interface EngineResults {
  curve: LearningPoint[];
  metrics: StrategyMetrics[]; // TOPSIS-ranked
  ahp: ReturnType<typeof ahpWeights>;
  shapley: ReturnType<typeof computeShapley>;
}

export default function App() {
  const [page, setPage] = useState<PageId>("overview");
  const [results, setResults] = useState<EngineResults | null>(null);

  // Train Nash-Q + evaluate strategies once on mount (deferred so UI paints).
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      // Live in-browser training drives the learning curve.
      const agent = new NashQLearning(7);
      const { curve } = agent.train(400);
      // The benchmark comparison reproduces the validated notebook run
      // (notebook/solution.ipynb) — a full 1,000-episode multi-agent training
      // that cannot be faithfully reproduced in a short browser pass. These
      // metrics are computed by the same algorithms; we re-rank them live with
      // the AHP weights so the TOPSIS pipeline runs in the browser too.
      const ahp = ahpWeights();
      const reference = precomputed.referenceMetrics.map(
        (m): StrategyMetrics => ({
          strategy: m.strategy as StrategyName,
          reward: m.reward,
          responseTime: m.responseTime,
          utilisation: m.utilisation,
          fairness: m.fairness,
          resolved: m.resolved,
          topsis: 0,
        }),
      );
      const metrics = topsisRank(reference, ahp.weights);
      const shapley = computeShapley();
      // Touch evaluateStrategies so the live evaluator stays wired for dev use.
      void evaluateStrategies;
      if (!cancelled) setResults({ curve, metrics, ahp, shapley });
    }, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  const content = useMemo(() => {
    if (!results) return null;
    switch (page) {
      case "overview":
        return <Overview results={results} onNavigate={setPage} />;
      case "simulation":
        return <Simulation />;
      case "gametheory":
        return <GameTheory results={results} />;
      case "analytics":
        return <Analytics results={results} />;
      case "methodology":
        return <Methodology />;
      default:
        return null;
    }
  }, [page, results]);

  return (
    <div className="min-h-screen relative">
      <div className="aurora-bg" />
      <div className="aurora-blob b1" />
      <div className="aurora-blob b2" />
      <div className="aurora-blob b3" />
      <div className="grid-overlay" />

      <Navbar page={page} onChange={setPage} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        {results ? content : <LoadingScreen />}
      </main>

      <footer className="text-center text-xs text-[var(--muted)] pb-8">
        DisasterCoord AI · Multi-Agent Disaster Response · MAIB DSC 103 · SP Jain
        School of Global Management, Dubai
      </footer>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
      <div className="relative">
        <Activity
          size={56}
          className="text-[var(--accent)] animate-spin-slow"
        />
        <div className="absolute inset-0 rounded-full ping-ring border-2 border-[var(--accent)]" />
      </div>
      <h2 className="mt-8 text-xl font-semibold text-gradient">
        Training Nash Q-Learning agents…
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)] max-w-md text-center">
        Running multi-agent reinforcement learning + game-theoretic equilibrium
        selection in your browser.
      </p>
      <div className="mt-6 h-2 w-72 rounded-full overflow-hidden glass">
        <div className="h-full w-1/2 shimmer" />
      </div>
    </div>
  );
}
