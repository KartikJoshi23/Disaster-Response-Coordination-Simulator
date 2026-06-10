import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ControlPanel from "./ControlPanel";
import DisasterGrid from "./DisasterGrid";
import {
  AgentId,
  AGENT_IDS,
  EnvSnapshot,
  StrategyName,
} from "../types";
import {
  COOPERATE_ACTION,
  DisasterEnvironment,
  N_ACTIONS,
} from "../engine/DisasterEnvironment";
import { NashQLearning } from "../engine/NashQLearning";
import { SeededRNG } from "../utils/poissonSampler";
import { Activity, Flame, HeartPulse, Truck, Waves, Sparkles, Timer, Gauge } from "lucide-react";

const AGENT_META: Record<
  AgentId,
  { color: string; icon: React.ReactNode }
> = {
  Medical: { color: "var(--medical)", icon: <HeartPulse size={16} /> },
  Rescue: { color: "var(--rescue)", icon: <Waves size={16} /> },
  Logistics: { color: "var(--logistics)", icon: <Truck size={16} /> },
};

export default function Simulation() {
  const envRef = useRef(new DisasterEnvironment(42));
  const agentRef = useRef<NashQLearning | null>(null);
  const rngRef = useRef(new SeededRNG(2024));
  const [snapshot, setSnapshot] = useState<EnvSnapshot>(() =>
    envRef.current.reset(42),
  );
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(420);
  const [strategy, setStrategy] = useState<StrategyName>("Nash Q-Learning");
  const [severityScale, setSeverityScale] = useState(1);
  const [resourceScale, setResourceScale] = useState(1);
  const [cooperationIncentive, setCooperationIncentive] = useState(1);

  // Train a lightweight Nash-Q agent in the background for the live policy.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const agent = new NashQLearning(7);
      agent.train(250);
      agentRef.current = agent;
    }, 30);
    return () => window.clearTimeout(id);
  }, []);

  const chooseActions = useCallback(
    (env: DisasterEnvironment): Record<AgentId, number> => {
      const state = env.discretiseState();
      switch (strategy) {
        case "Nash Q-Learning":
          return agentRef.current
            ? agentRef.current.act(state)
            : { Medical: 1, Rescue: 1, Logistics: 1 };
        case "Cooperative Fixed":
          return {
            Medical: COOPERATE_ACTION,
            Rescue: COOPERATE_ACTION,
            Logistics: COOPERATE_ACTION,
          };
        case "Greedy":
          return { Medical: 1, Rescue: 1, Logistics: 1 };
        default:
          return {
            Medical: rngRef.current.int(N_ACTIONS),
            Rescue: rngRef.current.int(N_ACTIONS),
            Logistics: rngRef.current.int(N_ACTIONS),
          };
      }
    },
    [strategy],
  );

  const stepOnce = useCallback(() => {
    const env = envRef.current;
    env.applyStep(chooseActions(env));
    setSnapshot(env.snapshot());
  }, [chooseActions]);

  const reset = useCallback(() => {
    setRunning(false);
    rngRef.current.reseed(2024);
    setSnapshot(envRef.current.reset(42));
  }, []);

  // Re-apply scenario knobs and restart the episode whenever a knob changes,
  // so the new coordination outcome is immediately observable.
  const applyConfig = useCallback(
    (next: Partial<{
      severityScale: number;
      resourceScale: number;
      cooperationIncentive: number;
    }>) => {
      envRef.current.configure(next);
      rngRef.current.reseed(2024);
      setSnapshot(envRef.current.reset(42));
    },
    [],
  );

  // Animation loop.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(stepOnce, speed);
    return () => window.clearInterval(id);
  }, [running, speed, stepOnce]);

  const fairness = useMemo(
    () => envRef.current.fairness(),
    // recompute whenever snapshot changes
    [snapshot],
  );
  const utilisation = useMemo(
    () => envRef.current.utilisation(),
    [snapshot],
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Live simulation</h2>
          <p className="text-sm text-[var(--muted)]">
            Watch three agencies coordinate across a 5×5 city grid in real time.
          </p>
        </div>
        <span className="badge text-[var(--accent-2)]">
          <Activity size={12} /> Phase: {snapshot.phase} · Step {snapshot.step}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">City incident grid</h3>
            <div className="flex gap-3 text-xs">
              {AGENT_IDS.map((a) => (
                <span key={a} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: AGENT_META[a].color }}
                  />
                  {a}
                </span>
              ))}
            </div>
          </div>
          <DisasterGrid snapshot={snapshot} />

          {/* Live metric strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <LiveStat
              label="Cumulative reward"
              value={snapshot.cumulativeReward.toFixed(1)}
              icon={<Sparkles size={14} />}
            />
            <LiveStat
              label="Resolved"
              value={String(snapshot.totalResolved)}
              icon={<Flame size={14} />}
            />
            <LiveStat
              label="Cooperation"
              value={String(snapshot.cooperationEvents)}
              icon={<Activity size={14} />}
            />
            <LiveStat
              label="Avg response time"
              value={snapshot.avgResponseTime.toFixed(2)}
              icon={<Timer size={14} />}
            />
            <LiveStat
              label="Fairness (Jain)"
              value={fairness.toFixed(3)}
              icon={<Waves size={14} />}
            />
            <LiveStat
              label="Utilisation"
              value={`${(utilisation * 100).toFixed(1)}%`}
              icon={<Gauge size={14} />}
            />
          </div>
        </div>

        {/* Controls + agent budgets */}
        <div className="space-y-6">
          <ControlPanel
            running={running}
            speed={speed}
            strategy={strategy}
            severityScale={severityScale}
            resourceScale={resourceScale}
            cooperationIncentive={cooperationIncentive}
            onToggleRun={() => setRunning((r) => !r)}
            onStep={stepOnce}
            onReset={reset}
            onSpeed={setSpeed}
            onStrategy={(s) => {
              setStrategy(s);
            }}
            onSeverity={(v) => {
              setSeverityScale(v);
              applyConfig({ severityScale: v });
            }}
            onResources={(v) => {
              setResourceScale(v);
              applyConfig({ resourceScale: v });
            }}
            onCoopIncentive={(v) => {
              setCooperationIncentive(v);
              applyConfig({ cooperationIncentive: v });
            }}
          />

          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Agency resource budgets</h3>
            <div className="space-y-4">
              {AGENT_IDS.map((a) => {
                const base = baseBudget(a);
                const remaining = snapshot.budgets[a];
                const pct = Math.max(0, Math.min(100, (remaining / base) * 100));
                return (
                  <div key={a}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span
                        className="flex items-center gap-2 font-medium"
                        style={{ color: AGENT_META[a].color }}
                      >
                        {AGENT_META[a].icon}
                        {a}
                      </span>
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {remaining.toFixed(0)} / {base}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${AGENT_META[a].color}, ${AGENT_META[a].color}aa)`,
                          boxShadow: `0 0 12px ${AGENT_META[a].color}66`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-between text-xs text-[var(--muted)]">
              <span>Resource utilisation</span>
              <span className="font-mono text-[var(--text)]">
                {(utilisation * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-3 border border-[var(--border)] bg-white/[0.02]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <div key={value} className="mt-1 text-lg font-bold font-mono animate-pop">
        {value}
      </div>
    </div>
  );
}

function baseBudget(a: AgentId): number {
  return a === "Medical" ? 26 : a === "Rescue" ? 10 : 98;
}
