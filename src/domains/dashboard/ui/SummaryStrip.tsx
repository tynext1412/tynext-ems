import { formatNumber, scaleEnergy, scaleIDR } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { DashboardSummary } from "../domain/overview";

interface Props {
  summary?: DashboardSummary;
  loading?: boolean;
  className?: string;
}

// Satu bilah bersegmen, bukan lima kartu identik. Produksi energi adalah KPI
// utama fleet PLTS, jadi hanya angka itu yang memakai aksen tembaga.
export function SummaryStrip({ summary, loading, className }: Props) {
  const energy = summary ? scaleEnergy(summary.generationKWh) : undefined;
  const revenue = summary ? scaleIDR(summary.revenueIDR) : undefined;

  return (
    <div
      className={cn(
        "panel-metal flex snap-x divide-x divide-border overflow-x-auto rounded-lg [scrollbar-width:none] md:overflow-visible",
        className,
      )}
      role="group"
      aria-label="Ringkasan fleet"
    >
      <Segment label="Total sites" value={summary && `${summary.activeSites}/${summary.totalSites}`} loading={loading} />
      <Segment label="PV install capacity" value={summary && formatNumber(summary.pvCapacityKWp, 1)} unit="kWp" loading={loading} />
      <Segment label="BESS install capacity" value={summary && formatNumber(summary.bessCapacityKWh, 0)} unit="kWh" loading={loading} />
      <Segment label="Energy generation" value={energy?.value} unit={energy?.unit} loading={loading} focal />
      <Segment label="Revenue" value={revenue && `Rp ${revenue.value}`} unit={revenue?.unit} loading={loading} />
    </div>
  );
}

function Segment({
  label,
  value,
  unit,
  loading,
  focal,
}: {
  label: string;
  value?: string;
  unit?: string;
  loading?: boolean;
  focal?: boolean;
}) {
  return (
    <div className={cn("min-w-36 shrink-0 snap-start px-4 py-2.5 md:min-w-0 md:flex-1", focal && "md:flex-[1.3]")}>
      <div className="text-[11px] text-muted">{label}</div>
      {loading || value === undefined ? (
        <Skeleton className="mt-1 h-6 w-20" />
      ) : (
        <div className={cn("mt-0.5 font-mono font-semibold leading-tight", focal ? "text-2xl" : "text-lg")}>
          <span className={focal ? "brand-text" : undefined}>{value}</span>
          {unit && <span className="ml-1 text-xs font-medium text-muted">{unit}</span>}
        </div>
      )}
    </div>
  );
}
