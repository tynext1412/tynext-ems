import { Info, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Panel";
import { OUTAGE_BAND, SERIES_COLOR, SERIES_LABEL, type SeriesKey } from "./chart-theme";

// Keterangan pita outage, tampil di samping legenda bila ada outage di tanggal itu.
export function OutageLegendItem() {
  return (
    <span className="flex h-7 items-center gap-1.5 px-1.5 text-xs text-muted">
      <span className="h-3 w-4 rounded-sm" style={{ background: OUTAGE_BAND.fill, opacity: OUTAGE_BAND.fillOpacity * 2.5 }} aria-hidden />
      Controller offline
    </span>
  );
}

// Legenda yang bisa dimatikan per seri. Warna tetap mengikuti entitas saat seri lain disembunyikan.
export function ChartLegend({ series, hidden, onToggle }: { series: readonly SeriesKey[]; hidden: ReadonlySet<SeriesKey>; onToggle: (key: SeriesKey) => void }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1" role="group" aria-label="Chart series">
      {series.map((key) => {
        const off = hidden.has(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(key)}
            className={cn("flex h-7 items-center gap-1.5 rounded-full px-1.5 text-xs text-muted hover:bg-surface-2 hover:text-text", off && "opacity-50")}
          >
            <span className="size-2 rounded-full" style={{ background: SERIES_COLOR[key] }} aria-hidden />
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
  // Opsional: label & warna khusus (chart parameter perangkat) menggantikan yang dari katalog seri.
  label?: string;
  color?: string;
}

// Tooltip: judul (waktu/periode) + baris per seri dengan swatch; teks memakai token teks, bukan warna seri.
// Latar 65 % buram dengan blur tipis supaya garis chart di belakangnya tetap terlihat tapi teks terbaca.
export function ChartTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-xl border border-border/65 bg-surface/65 px-3 py-2 text-xs shadow-overlay backdrop-blur-sm">
      <div className="mb-1 font-mono text-muted">{title}</div>
      <dl className="space-y-0.5">
        {rows.map((r, i) => (
          <div key={`${r.key}-${r.label ?? i}`} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: r.color ?? SERIES_COLOR[r.key] }} aria-hidden />
              {r.label ?? SERIES_LABEL[r.key]}
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
    <div className="max-h-64 overflow-auto rounded-xl border border-separator text-xs">
      <table className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-bg text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-separator font-mono">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Petunjuk kecil berbentuk pill ("Scroll to zoom", "Drag to rotate").
export function HintChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-3 px-2.5 text-xs text-text", className)}>
      <Info className="size-3.5 shrink-0 text-muted" aria-hidden />
      {children}
    </span>
  );
}

interface ZoomControls {
  zoomed: boolean;
  onReset: () => void;
  rangeLabel?: string; // rentang yang sedang terlihat bila di-zoom
}

interface ChartFrameProps {
  title: string;
  unit?: string; // "(kW)", ditampilkan redup di samping judul
  legend?: ReactNode;
  children: ReactNode;
  table?: ReactNode; // kembaran tabel, ditampilkan lewat tombol "View as table"
  zoom?: ZoomControls;
}

// Kartu satu chart: judul + legenda, chart, lalu baris aksi (View as table · Reset · petunjuk zoom).
export function ChartFrame({ title, unit, legend, children, table, zoom }: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card>
      <section aria-label={title}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-text">
            {title}
            {unit && <span className="ml-1 font-normal text-muted">{unit}</span>}
          </h3>
          {legend}
        </div>
        {children}
        {showTable && table && <div className="mt-3">{table}</div>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {table ? (
            <Button variant="secondary" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable} className="text-brand">
              <Table2 className="size-4" aria-hidden />
              {showTable ? "Hide table" : "View as table"}
            </Button>
          ) : (
            <span />
          )}
          {zoom && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={zoom.onReset} disabled={!zoom.zoomed} className="text-text">
                Reset
              </Button>
              <HintChip>{zoom.zoomed && zoom.rangeLabel ? `${zoom.rangeLabel} · Double-click to reset` : "Scroll to zoom"}</HintChip>
            </div>
          )}
        </div>
      </section>
    </Card>
  );
}
