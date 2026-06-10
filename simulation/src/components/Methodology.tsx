import {
  Brain,
  Eye,
  Swords,
  Network,
  Users,
  Scale,
  Database,
  Sigma,
} from "lucide-react";

const TOPICS = [
  {
    code: "T4",
    icon: <Brain size={18} />,
    title: "Markov Decision Process",
    color: "var(--accent)",
    body: "A single-agency dispatch problem solved with Value Iteration and Policy Iteration over a discretised 75-state space (phase × resource pressure × load), θ = 1e-6.",
    eq: "V(s) = maxₐ Σₛ′ P(s′|s,a)[R + γV(s′)]",
  },
  {
    code: "T8",
    icon: <Eye size={18} />,
    title: "POMDP belief filtering",
    color: "var(--rescue)",
    body: "Hidden zone severity is inferred from noisy sensors using an exact discrete Bayes filter, cross-checked with a 100-particle filter.",
    eq: "b′(s′) ∝ O(o|s′) Σₛ P(s′|s,a) b(s)",
  },
  {
    code: "T9",
    icon: <Swords size={18} />,
    title: "Nash equilibrium",
    color: "var(--logistics)",
    body: "The 3-player stage game (5³ joint actions) is solved by Iterated Best Response, validated against nashpy for the 2-player reduction.",
    eq: "∀i: πᵢ* ∈ argmax Uᵢ(πᵢ, π₋ᵢ*)",
  },
  {
    code: "T10",
    icon: <Network size={18} />,
    title: "Nash Q-Learning",
    color: "var(--accent-2)",
    body: "Joint-action Q-tables Qᵢ(s,a₁,a₂,a₃) are updated toward each agent's reward plus γ times the Nash value of the next state; ε-greedy decays 1.0→0.05.",
    eq: "Qᵢ ← Qᵢ + α[rᵢ + γ·Nashᵢ(s′) − Qᵢ]",
  },
  {
    code: "T3",
    icon: <Users size={18} />,
    title: "Shapley value",
    color: "var(--medical)",
    body: "Each agency's fair share of cooperative surplus is its average marginal contribution over all coalition orderings; the efficiency axiom is verified.",
    eq: "φᵢ = Σ |S|!(n−|S|−1)!/n! [v(S∪i)−v(S)]",
  },
  {
    code: "T11",
    icon: <Scale size={18} />,
    title: "AHP-TOPSIS",
    color: "var(--good)",
    body: "AHP derives criterion weights from an expert pairwise matrix (CR < 0.1); TOPSIS then ranks strategies by closeness to the ideal solution.",
    eq: "C* = D⁻ / (D⁺ + D⁻)",
  },
];

const PIPELINE = [
  "FEMA + 911 data calibration (λ, budgets)",
  "DisasterEnvironment (5×5 grid, Poisson arrivals)",
  "MDP — Value / Policy Iteration",
  "POMDP — Bayesian belief update",
  "Nash equilibrium — Iterated Best Response",
  "Nash Q-Learning — multi-agent training",
  "Shapley value — fair attribution",
  "AHP-TOPSIS — strategy ranking",
];

export default function Methodology() {
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h2 className="text-2xl font-bold text-gradient">Methodology</h2>
        <p className="text-sm text-[var(--muted)] max-w-2xl">
          Six course techniques from Reasoning &amp; Decision Making Under
          Uncertainty, composed into a single multi-agent coordination pipeline.
        </p>
      </header>

      {/* Technique grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TOPICS.map((t, i) => (
          <div
            key={t.code}
            className="glass rounded-2xl p-6 glass-hover animate-fade-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="grid place-items-center w-10 h-10 rounded-xl"
                style={{ background: `${t.color}22`, color: t.color }}
              >
                {t.icon}
              </span>
              <span
                className="badge font-mono"
                style={{ color: t.color, borderColor: `${t.color}55` }}
              >
                {t.code}
              </span>
            </div>
            <h3 className="font-semibold">{t.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              {t.body}
            </p>
            <code className="mt-3 block rounded-lg bg-black/30 border border-[var(--border)] px-3 py-2 text-[11px] font-mono text-[var(--accent-2)] overflow-x-auto">
              {t.eq}
            </code>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <section className="glass rounded-2xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-5">
          <Sigma size={16} className="text-[var(--accent)]" /> End-to-end
          pipeline
        </h3>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PIPELINE.map((p, i) => (
            <li
              key={p}
              className="flex items-center gap-3 rounded-xl p-3 border border-[var(--border)] bg-white/[0.02]"
            >
              <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm">{p}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Data provenance */}
      <section className="glass rounded-2xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Database size={16} className="text-[var(--logistics)]" /> Data
          provenance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <DataCard
            title="FEMA Declarations"
            detail="29,752 records (2010–2024). Drives agency mapping, Poisson λ and resource budgets."
          />
          <DataCard
            title="911 Call Logs"
            detail="663,522 EMS / Fire / Traffic calls. Calibrates hourly arrival intensity per agency."
          />
          <DataCard
            title="PA Funded Projects"
            detail="Public-Assistance obligations set the relative magnitude of agency resource budgets."
          />
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          The interactive simulation, belief filter, Nash equilibrium, Shapley
          value and AHP-TOPSIS pipeline all run live in your browser. The
          four-strategy benchmark reproduces the validated 1,000-episode run
          from the companion notebook, computed by the same algorithms.
        </p>
      </section>
    </div>
  );
}

function DataCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl p-4 border border-[var(--border)] bg-white/[0.02] glass-hover">
      <div className="font-semibold">{title}</div>
      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
        {detail}
      </p>
    </div>
  );
}
