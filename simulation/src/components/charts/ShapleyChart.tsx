import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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
  const data = Object.entries(shapley.values).map(([k, v]) => ({
    name: k,
    value: Number(v.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <defs>
          <filter id="glow" height="160%" width="160%" x="-30%" y="-30%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={62}
          outerRadius={100}
          paddingAngle={4}
          isAnimationActive
          animationDuration={900}
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
          stroke="rgba(10,10,15,0.6)"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={COLORS[d.name]} filter="url(#glow)" />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
