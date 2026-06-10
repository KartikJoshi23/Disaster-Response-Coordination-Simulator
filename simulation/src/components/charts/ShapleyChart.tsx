import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ShapleyResult } from "../../types";

interface Props {
  shapley: ShapleyResult;
}

const COLORS: Record<string, string> = {
  Medical: "#ff4d6d",
  Rescue: "#4dd0ff",
  Logistics: "#ffd166",
};

export default function ShapleyChart({ shapley }: Props) {
  // Shapley values can be negative when an agency's marginal contribution is
  // congestive (e.g. Medical lowers the joint resolved count), so a signed bar
  // chart is the faithful representation — matching the notebook figure.
  const data = Object.entries(shapley.values).map(([k, v]) => ({
    name: k,
    value: Number(v.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 8 }}>
        <defs>
          <filter id="shapglow" height="160%" width="160%" x="-30%" y="-30%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          width={44}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "rgba(10,10,15,0.92)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--text)",
          }}
          formatter={(v: number) => [`${v}`, "Shapley φ"]}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={900}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={COLORS[d.name]} filter="url(#shapglow)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
