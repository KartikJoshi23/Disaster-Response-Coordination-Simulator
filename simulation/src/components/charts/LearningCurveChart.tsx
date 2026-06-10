import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LearningPoint } from "../../types";

interface Props {
  data: LearningPoint[];
}

/** Smooth a noisy series with a simple moving average for readability. */
function smooth(data: LearningPoint[], window = 15) {
  return data.map((d, i) => {
    const lo = Math.max(0, i - window);
    const slice = data.slice(lo, i + 1);
    const avgR = slice.reduce((a, b) => a + b.reward, 0) / slice.length;
    const avgC = slice.reduce((a, b) => a + b.cooperation, 0) / slice.length;
    return {
      episode: d.episode,
      reward: Number(avgR.toFixed(2)),
      cooperation: Number(avgC.toFixed(2)),
      epsilon: Number(d.epsilon.toFixed(3)),
    };
  });
}

export default function LearningCurveChart({ data }: Props) {
  const series = smooth(data);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={series} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="rewardFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="episode"
          stroke="#9aa0b5"
          tick={{ fontSize: 11 }}
          label={{
            value: "Episode",
            position: "insideBottom",
            offset: -2,
            fill: "#9aa0b5",
            fontSize: 11,
          }}
        />
        <YAxis stroke="#9aa0b5" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="reward"
          stroke="#7c5cff"
          strokeWidth={2.5}
          fill="url(#rewardFill)"
          name="Reward (MA)"
          isAnimationActive
          animationDuration={900}
        />
        <Line
          type="monotone"
          dataKey="cooperation"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
          name="Cooperation events (MA)"
          isAnimationActive
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
