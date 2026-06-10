import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StrategyMetrics } from "../../types";

interface Props {
  metrics: StrategyMetrics[]; // already TOPSIS-ranked
}

const BAR_COLORS = ["#7c5cff", "#22d3ee", "#ffd166", "#ff4d6d"];

export default function TOPSISChart({ metrics }: Props) {
  const data = metrics.map((m) => ({
    strategy: m.strategy.replace(" Q-Learning", " Q"),
    topsis: Number(m.topsis.toFixed(3)),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 18, right: 16, left: -6, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="strategy" stroke="#9aa0b5" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 1]} stroke="#9aa0b5" tick={{ fontSize: 11 }} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar
          dataKey="topsis"
          radius={[8, 8, 0, 0]}
          isAnimationActive
          animationDuration={900}
          name="TOPSIS C*"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
          <LabelList
            dataKey="topsis"
            position="top"
            fill="#e7e9f3"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
