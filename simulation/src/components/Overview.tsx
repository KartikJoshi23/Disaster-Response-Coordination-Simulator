import { EngineResults } from "../App";
import { PageId } from "./Navbar";
import TOPSISChart from "./charts/TOPSISChart";
import {
  Activity,
  ArrowRight,
  Brain,
  Network,
  Scale,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { CALIBRATION } from "../engine/DisasterEnvironment";

interface Props {
  results: EngineResults;
  onNavigate: (p: PageId) => void;
}

export default function Overview({ results, onNavigate }: Props) {
  const best = results.metrics[0];
  const greedy = results.metrics.find((m) => m.strategy === "Greedy");
  const gain =
    best && greedy
      ? ((best.topsis - greedy.topsis) / greedy.topsis) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="glass-strong rounded-3xl p-8 sm:p-12 relative overflow-hidden animate-fade-up">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[var(--accent)]/20 blur-3xl animate-float" />
        <div className="relative">
          <span className="badge text-[var(--accent-2)]">
            <Activity size={12} /> Reasoning & Decision Making Under Uncertainty
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-gradient max-w-3xl">
            Coordinating disaster response with game theory & reinforcement
            learning
          </h1>
          <p className="mt-4 text-[var(--muted)] max-w-2xl leading-relaxed">
            Three autonomous agencies — Medical, Rescue and Logistics — learn to
            allocate scarce resources across a city under uncertainty. The system
            combines Markov Decision Processes, POMDP belief filtering, Nash
            Q-Learning, the Shapley value and AHP-TOPSIS multi-criteria ranking,
            calibrated on real FEMA and 911 emergency data.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("simulation")}
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white shadow-lg hover:shadow-[0_0_30px_rgba(124,92,255,0.5)] transition"
            >
              Launch live simulation
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition"
              />
            </button>
            <button
              onClick={() => onNavigate("analytics")}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold glass glass-hover"
            >
              Explore analytics
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Target className="text-[var(--accent)]" />}
          label="Best strategy (TOPSIS)"
          value={best ? best.strategy : "—"}
          sub={best ? `C* = ${best.topsis.toFixed(3)}` : ""}
          delay={0}
        />
        <KpiCard
          icon={<TrendingUp className="text-[var(--good)]" />}
          label="Nash-Q vs Greedy"
          value={`+${gain.toFixed(1)}%`}
          sub="composite decision score"
          delay={0.05}
        />
        <KpiCard
          icon={<Scale className="text-[var(--logistics)]" />}
          label="AHP consistency"
          value={`CR ${results.ahp.cr.toFixed(3)}`}
          sub={results.ahp.consistent ? "consistent (<0.1)" : "review"}
          delay={0.1}
        />
        <KpiCard
          icon={<Users className="text-[var(--rescue)]" />}
          label="Shapley grand value"
          value={results.shapley.grandValue.toFixed(1)}
          sub={results.shapley.efficiencyOk ? "efficiency verified" : "—"}
          delay={0.15}
        />
      </section>

      {/* TOPSIS + technique grid */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass rounded-2xl p-6 glass-hover animate-fade-up">
          <h3 className="font-semibold mb-1">Strategy ranking</h3>
          <p className="text-xs text-[var(--muted)] mb-3">
            TOPSIS closeness coefficient across response time, utilisation,
            fairness and incidents resolved.
          </p>
          <TOPSISChart metrics={results.metrics} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          <TechniqueCard
            icon={<Brain size={18} />}
            title="MDP & POMDP"
            body="Value/Policy Iteration for optimal dispatch; Bayesian belief filtering under noisy severity sensors."
          />
          <TechniqueCard
            icon={<Network size={18} />}
            title="Nash Q-Learning"
            body="Three agents learn a welfare-maximising Nash equilibrium via multi-start Iterated Best Response."
          />
          <TechniqueCard
            icon={<Scale size={18} />}
            title="Shapley & AHP-TOPSIS"
            body="Fair credit allocation across agencies and transparent multi-criteria strategy ranking."
          />
        </div>
      </section>

      {/* Calibration strip */}
      <section className="glass rounded-2xl p-6 animate-fade-up">
        <h3 className="font-semibold mb-4">
          Data-calibrated agency parameters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["Medical", "Rescue", "Logistics"] as const).map((a) => (
            <div
              key={a}
              className="rounded-xl p-4 border border-[var(--border)] bg-white/[0.02]"
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold"
                  style={{
                    color:
                      a === "Medical"
                        ? "var(--medical)"
                        : a === "Rescue"
                          ? "var(--rescue)"
                          : "var(--logistics)",
                  }}
                >
                  {a}
                </span>
                <span className="badge">λ = {CALIBRATION.lambda[a]}</span>
              </div>
              <div className="mt-3 text-xs text-[var(--muted)] space-y-1">
                <div className="flex justify-between">
                  <span>Resource budget</span>
                  <span className="text-[var(--text)]">
                    {CALIBRATION.budget[a]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Program activation</span>
                  <span className="text-[var(--text)]">
                    {(CALIBRATION.programActivation[a] * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Derived from FEMA Disaster Declarations (2010–2024) and 911 emergency
          call logs in the companion notebook.
        </p>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  delay: number;
}) {
  return (
    <div
      className="glass rounded-2xl p-5 glass-hover animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/[0.04]">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold animate-pop">{value}</div>
      <div className="text-xs text-[var(--muted)] mt-1">{sub}</div>
    </div>
  );
}

function TechniqueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 glass-hover animate-fade-up">
      <div className="flex items-center gap-2 font-semibold">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)]/40 to-[var(--accent-2)]/30">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{body}</p>
    </div>
  );
}
