import { NashCell } from "../../types";

interface Props {
  cells: NashCell[];
  rowLabels: string[];
  colLabels: string[];
}

/**
 * 2-player payoff bimatrix heat-grid with the Nash equilibrium cell highlighted.
 * Cooperate vs Defect style game between two responder agencies.
 */
export default function NashPayoffChart({ cells, rowLabels, colLabels }: Props) {
  const nRows = rowLabels.length;
  const nCols = colLabels.length;
  const maxPay = Math.max(...cells.map((c) => c.payoffRow + c.payoffCol), 1);

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-2"
        style={{
          gridTemplateColumns: `auto repeat(${nCols}, minmax(96px, 1fr))`,
        }}
      >
        <div />
        {colLabels.map((c) => (
          <div
            key={c}
            className="text-center text-xs font-semibold text-[var(--rescue)] pb-1"
          >
            {c}
          </div>
        ))}

        {Array.from({ length: nRows }).map((_, r) => (
          <FragmentRow
            key={r}
            r={r}
            nCols={nCols}
            rowLabel={rowLabels[r]}
            cells={cells}
            maxPay={maxPay}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Cells show (row payoff, col payoff). The{" "}
        <span className="text-[var(--good)] font-semibold">green</span> cell is a
        pure-strategy Nash equilibrium found via Iterated Best Response.
      </p>
    </div>
  );
}

function FragmentRow({
  r,
  nCols,
  rowLabel,
  cells,
  maxPay,
}: {
  r: number;
  nCols: number;
  rowLabel: string;
  cells: NashCell[];
  maxPay: number;
}) {
  return (
    <>
      <div className="flex items-center text-xs font-semibold text-[var(--medical)] pr-2">
        {rowLabel}
      </div>
      {Array.from({ length: nCols }).map((_, c) => {
        const cell = cells.find((x) => x.row === r && x.col === c);
        if (!cell) return <div key={c} />;
        const intensity = (cell.payoffRow + cell.payoffCol) / maxPay;
        return (
          <div
            key={c}
            className={`zone-cell grid place-items-center py-4 text-sm font-mono transition ${
              cell.isEquilibrium ? "ring-2 ring-[var(--good)]" : ""
            }`}
            style={{
              background: cell.isEquilibrium
                ? "rgba(52,211,153,0.18)"
                : `rgba(124,92,255,${0.10 + intensity * 0.35})`,
            }}
          >
            <span className="text-[var(--medical)]">
              {cell.payoffRow.toFixed(1)}
            </span>
            <span className="text-[var(--muted)] mx-1">,</span>
            <span className="text-[var(--rescue)]">
              {cell.payoffCol.toFixed(1)}
            </span>
          </div>
        );
      })}
    </>
  );
}
