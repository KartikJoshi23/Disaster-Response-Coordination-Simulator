import { Pause, Play, RotateCcw, StepForward, Gauge, SlidersHorizontal } from "lucide-react";
import { StrategyName, STRATEGY_NAMES } from "../types";

interface Props {
  running: boolean;
  speed: number;
  strategy: StrategyName;
  severityScale: number;
  resourceScale: number;
  cooperationIncentive: number;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeed: (v: number) => void;
  onStrategy: (s: StrategyName) => void;
  onSeverity: (v: number) => void;
  onResources: (v: number) => void;
  onCoopIncentive: (v: number) => void;
}

export default function ControlPanel({
  running,
  speed,
  strategy,
  severityScale,
  resourceScale,
  cooperationIncentive,
  onToggleRun,
  onStep,
  onReset,
  onSpeed,
  onStrategy,
  onSeverity,
  onResources,
  onCoopIncentive,
}: Props) {
  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      <h3 className="font-semibold flex items-center gap-2">
        <Gauge size={16} className="text-[var(--accent)]" /> Control panel
      </h3>

      {/* Transport */}
      <div className="flex gap-2">
        <button
          onClick={onToggleRun}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition ${
            running
              ? "bg-[var(--medical)]/20 text-[var(--medical)] border border-[var(--medical)]/40"
              : "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white shadow-lg"
          }`}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Run"}
        </button>
        <button
          onClick={onStep}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 glass glass-hover disabled:opacity-40"
        >
          <StepForward size={16} /> Step
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 glass glass-hover"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {/* Speed */}
      <div>
        <div className="flex justify-between text-xs text-[var(--muted)] mb-2">
          <span>Simulation speed</span>
          <span className="text-[var(--text)] font-mono">
            {(1000 / speed).toFixed(1)} steps/s
          </span>
        </div>
        <input
          type="range"
          min={120}
          max={1200}
          step={60}
          value={1320 - speed}
          onChange={(e) => onSpeed(1320 - Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Strategy selector */}
      <div>
        <div className="text-xs text-[var(--muted)] mb-2">
          Coordination policy
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STRATEGY_NAMES.map((s) => (
            <button
              key={s}
              onClick={() => onStrategy(s)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition border ${
                strategy === s
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-white"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-white"
              }`}
            >
              {s.replace(" Q-Learning", " Q")}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          {DESCRIPTIONS[strategy]}
        </p>
      </div>

      {/* Scenario knobs — the spec's user-modifiable parameters */}
      <div className="pt-4 border-t border-[var(--border)] space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <SlidersHorizontal size={13} className="text-[var(--accent-2)]" />
          Scenario parameters
        </div>

        <Slider
          label="Disaster severity"
          value={severityScale}
          min={0.5}
          max={2}
          step={0.1}
          onChange={onSeverity}
          hint="Scales incident intensity across the grid."
        />
        <Slider
          label="Resource availability"
          value={resourceScale}
          min={0.4}
          max={1.6}
          step={0.1}
          onChange={onResources}
          hint="Scales each agency's starting resource budget."
        />
        <Slider
          label="Cooperation incentive"
          value={cooperationIncentive}
          min={0}
          max={2}
          step={0.1}
          onChange={onCoopIncentive}
          hint="Strength of the synergy bonus when agencies coordinate."
        />
        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          Adjusting any parameter restarts the episode so you can observe the
          coordination outcome under the new conditions.
        </p>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[var(--text)]">{label}</span>
        <span className="font-mono text-[var(--accent)]">
          ×{value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <p className="mt-1 text-[10px] text-[var(--muted)]">{hint}</p>
    </div>
  );
}

const DESCRIPTIONS: Record<StrategyName, string> = {
  "Nash Q-Learning":
    "Agents pick a welfare-maximising Nash equilibrium learned from experience — cooperating on severe zones.",
  "Cooperative Fixed":
    "All agencies always pool effort. Strong on severe events but wasteful on mild incidents.",
  Greedy:
    "Each agency myopically attacks the single worst incident, ignoring coordination.",
  Random: "Uniformly random dispatch — the lower-bound baseline.",
};
