import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { SERIES_COLOR, SERIES_LABEL, type SeriesKey } from "./chart-theme";

// Legenda yang bisa dimatikan per seri. Warna tetap mengikuti entitas saat seri lain disembunyikan.
export function ChartLegend({ series, hidden, onToggle }: { series: readonly SeriesKey[]; hidden: ReadonlySet<SeriesKey>; onToggle: (key: SeriesKey) => void }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1" role="group" aria-label="Seri chart">
      {series.map((key) => {
        const off = hidden.has(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(key)}
            className={cn("flex h-8 items-center gap-2 rounded-md px-1.5 text-xs text-muted hover:text-text", off && "opacity-50")}
          >
            <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES_COLOR[key] }} aria-hidden />
            <span className={off ? "line-through" : undefined}>{SERIES_LABEL[key]}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface TooltipRow {
  key: SeriesKey;
  value: string;
}

// Tooltip gelap: judul (waktu/periode) + baris per seri dengan swatch; teks memakai token teks, bukan warna seri.
export function ChartTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
      <div className="mb-1 font-mono text-muted">{title}</div>
      <dl className="space-y-0.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: SERIES_COLOR[r.key] }} aria-hidden />
              {SERIES_LABEL[r.key]}
            </dt>
            <dd className="font-mono">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Kembaran tabel untuk setiap chart: nilai tidak pernah hanya bisa dibaca lewat hover.
export function ChartTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer select-none text-muted hover:text-text">Lihat sebagai tabel</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-md border border-border">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-bg text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-2 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartFrame({ title, legend, children, table }: { title: string; legend?: ReactNode; children: ReactNode; table?: ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {legend}
      </div>
      {children}
      {table}
    </section>
  );
}
