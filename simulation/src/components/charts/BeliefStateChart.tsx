import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BeliefStep } from "../../types";

interface Props {
  step: BeliefStep;
  trueLevel: number;
}

/** Bar chart of the current posterior belief over severity levels 1..5. */
export default function BeliefStateChart({ step, trueLevel }: Props) {
  const data = step.belief.map((p, i) => ({
    level: `S${i + 1}`,
    prob: Number((p * 100).toFixed(1)),
    isTrue: i + 1 === trueLevel,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="level" stroke="#9aa0b5" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          stroke="#9aa0b5"
          tick={{ fontSize: 11 }}
          unit="%"
        />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar
          dataKey="prob"
          radius={[8, 8, 0, 0]}
          isAnimationActive
          animationDuration={500}
          name="Belief P(severity)"
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.isTrue ? "#34d399" : "#7c5cff"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
