import { RefreshCw } from "lucide-react";
import bessArt from "@/assets/figma/artwork/bess-capacity.png";
import energyArt from "@/assets/figma/artwork/energy-generation.png";
import pvArt from "@/assets/figma/artwork/pv-capacity.png";
import revenueArt from "@/assets/figma/artwork/revenue.png";
import sitesArt from "@/assets/figma/artwork/total-sites.png";
import { formatNumber, scaleEnergy, scaleIDR } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { WidgetState } from "../application/use-dashboard-overview";
import type { PerformanceSummary, PlantSummary } from "../domain/overview";

interface KpiCardProps {
  label: string;
  value?: string;
  unit?: string;
  artwork: string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

// Satu kartu KPI persis seperti Figma: 220×80 tanpa bayangan, teks di (16,14): label 12 px + nilai 24 px dan
// satuan 14 px; ubin biru 40×40 radius 8 diputar 41,7° (pusat di 200,68) terpotong sudut kanan bawah,
// ilustrasi 40 px di (176,28) di atasnya.
export function KpiCard({ label, value, unit, artwork, loading, error, onRetry, className }: KpiCardProps) {
  return (
    <div className={cn("relative h-20 w-[220px] shrink-0 overflow-hidden rounded-xl bg-surface", className)}>
      <div className="pointer-events-none absolute right-0 top-12 size-10 rotate-[41.7deg] rounded-lg bg-[#b8d7ff]/40" aria-hidden />
      <img src={artwork} alt="" className="pointer-events-none absolute right-1 top-7 size-10" aria-hidden />
      <div className="absolute left-4 top-3.5">
        <div className="whitespace-nowrap text-xs leading-5 text-muted">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-24" />
        ) : error ? (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-danger-text">
            <span>Couldn't load</span>
            <Button iconOnly size="sm" variant="tertiary" onClick={onRetry} aria-label={`Muat ulang ${label}`} className="size-7">
              <RefreshCw className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="font-mono text-2xl font-semibold leading-8 text-text">{value ?? "–"}</span>
            {unit && <span className="text-sm leading-6 text-muted">{unit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

interface KpiRowProps {
  plantSummary?: PlantSummary;
  performanceSummary?: PerformanceSummary;
  plantsState: WidgetState;
  performancesState: WidgetState;
  className?: string;
}

// Lima kartu KPI (1148 px, jarak 12) di tengah; tiap kartu memakai sumber datanya sendiri sehingga gagal terpisah.
export function KpiRow({ plantSummary, performanceSummary, plantsState, performancesState, className }: KpiRowProps) {
  const energy = performanceSummary ? scaleEnergy(performanceSummary.generationKWh, 2) : undefined;
  const revenue = performanceSummary ? scaleIDR(performanceSummary.revenueIDR, 2) : undefined;
  const plantProps = { loading: plantsState.isPending, error: plantsState.error, onRetry: plantsState.retry };
  const perfProps = { loading: performancesState.isPending, error: performancesState.error, onRetry: performancesState.retry };

  return (
    <div className={cn("flex gap-3 overflow-x-auto px-6 [scrollbar-width:none]", className)} role="group" aria-label="Ringkasan fleet">
      <div className="mx-auto flex shrink-0 gap-3">
        <KpiCard label="Total Sites" value={plantSummary && formatNumber(plantSummary.totalSites, 0)} artwork={sitesArt} {...plantProps} />
        <KpiCard label="PV Install Capacity" value={plantSummary && formatNumber(plantSummary.pvCapacityKWp, 1)} unit="kWp" artwork={pvArt} {...plantProps} />
        <KpiCard label="BESS Install Capacity" value={plantSummary && formatNumber(plantSummary.bessCapacityKWh, 0)} unit="kWh" artwork={bessArt} {...plantProps} />
        <KpiCard label="Energy Generation" value={energy?.value} unit={energy?.unit} artwork={energyArt} {...perfProps} />
        <KpiCard label="Revenue" value={revenue && `Rp ${revenue.value}`} unit={revenue?.unit || undefined} artwork={revenueArt} {...perfProps} />
      </div>
    </div>
  );
}
