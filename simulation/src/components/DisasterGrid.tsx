import { AgentId, EnvSnapshot } from "../types";
import { GRID_SIZE } from "../engine/DisasterEnvironment";

interface Props {
  snapshot: EnvSnapshot;
}

const TYPE_COLOR: Record<AgentId, string> = {
  Medical: "#ff4d6d",
  Rescue: "#4dd0ff",
  Logistics: "#ffd166",
};

/** Map a load value (0..~25) to a heat colour. */
function heat(load: number): string {
  if (load <= 0) return "rgba(255,255,255,0.03)";
  const t = Math.min(1, load / 18);
  // interpolate purple -> red as severity rises
  const r = Math.round(124 + t * (255 - 124));
  const g = Math.round(92 + t * (60 - 92));
  const b = Math.round(255 + t * (90 - 255));
  return `rgba(${r},${g},${b},${0.25 + t * 0.6})`;
}

export default function DisasterGrid({ snapshot }: Props) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
    >
      {snapshot.zones.map((z) => {
        const active = z.load > 0;
        return (
          <div
            key={z.index}
            className="zone-cell aspect-square grid place-items-center relative"
            style={{ background: heat(z.load) }}
            title={`Zone ${z.index} · load ${z.load}`}
          >
            {active && (
              <>
                <span
                  className="absolute inset-0 rounded-[12px] ping-ring border"
                  style={{
                    borderColor: z.dominantType
                      ? TYPE_COLOR[z.dominantType]
                      : "#fff",
                    opacity: 0.4,
                  }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pop"
                  style={{
                    background: z.dominantType
                      ? TYPE_COLOR[z.dominantType]
                      : "#fff",
                    boxShadow: `0 0 12px ${
                      z.dominantType ? TYPE_COLOR[z.dominantType] : "#fff"
                    }`,
                  }}
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-mono text-white/70">
                  {z.load}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
