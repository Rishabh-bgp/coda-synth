import { cn } from "@/lib/utils";

export function Heatmap({
  matrix,
  labels,
  compact,
}: {
  matrix: number[][];
  labels: string[];
  compact?: boolean;
}) {
  const max = Math.max(1, ...matrix.flat());
  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `minmax(5.5rem,auto) repeat(${labels.length}, minmax(${compact ? "1.75rem" : "3.25rem"}, 1fr))`,
        }}
      >
        <div />
        {labels.map((l) => (
          <div
            key={`c-${l}`}
            className="px-0.5 pb-2 text-center text-[10px] text-muted-foreground"
            title={l}
          >
            <span className={compact ? "inline-block origin-bottom -rotate-45" : ""}>
              {compact ? l.slice(0, 3) : l}
            </span>
          </div>
        ))}
        {matrix.map((row, i) => (
          <div key={`r-${labels[i]}`} className="contents">
            <div className="pr-2 text-right text-[10px] text-muted-foreground">{compact ? labels[i]!.slice(0, 4) : labels[i]}</div>
            {row.map((v, j) => {
              const t = v / max;
              return (
                <div
                  key={`${i}-${j}`}
                  title={`${labels[i]} → ${labels[j]}: ${v}`}
                  className={cn(
                    "flex aspect-square items-center justify-center text-[10px] tabular-nums",
                    i === j ? "text-background" : "text-foreground",
                  )}
                  style={{
                    background: `color-mix(in oklab, var(--color-primary) ${Math.round(t * 88)}%, var(--color-muted))`,
                  }}
                >
                  {v || ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarList({
  items,
}: {
  items: { name: string; value: number; positive?: boolean }[];
}) {
  const max = Math.max(0.001, ...items.map((i) => Math.abs(i.value)));
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.name} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <div className="mb-1 truncate font-mono text-xs text-muted-foreground" title={it.name}>
              {it.name}
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", it.positive === false ? "bg-human" : "bg-llm")}
                style={{ width: `${(Math.abs(it.value) / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="font-mono text-xs tabular-nums">{it.value.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

export function RocChart({ fpr, tpr }: { fpr: number[]; tpr: number[] }) {
  const w = 320;
  const h = 220;
  const pad = 28;
  const xs = fpr.map((x) => pad + x * (w - pad * 2));
  const ys = tpr.map((y) => h - pad - y * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md text-foreground" role="img" aria-label="ROC curve">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" opacity="0.2" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="currentColor" opacity="0.2" />
      <line
        x1={pad}
        y1={h - pad}
        x2={w - pad}
        y2={pad}
        stroke="currentColor"
        opacity="0.25"
        strokeDasharray="4 4"
      />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.75" />
      <text x={w / 2} y={h - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
        False positive rate
      </text>
      <text
        x={12}
        y={h / 2}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="10"
        transform={`rotate(-90 12 ${h / 2})`}
      >
        True positive rate
      </text>
    </svg>
  );
}
