import { ChartColumn, RefreshCw, Zap } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import energyArt from "@/assets/figma/artwork/energy-generation.png";
import lifetimeArt from "@/assets/figma/artwork/lifetime-energy.png";
import revenueArt from "@/assets/figma/artwork/revenue.png";
import { calculateImpact, DEFAULT_EMISSION_FACTORS } from "@/domains/impact/domain/impact";
import { EnvironmentalBenefitsPanel } from "@/domains/impact/ui/EnvironmentalBenefitsPanel";
import { useOperatingData, usePerformances } from "@/domains/performance/application/use-performances";
import type { Period } from "@/domains/performance/domain/performance";
import { toDateKey } from "@/shared/domain/time";
import { scaleEnergy, scaleIDR } from "@/shared/domain/units";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSiteContext } from "../application/use-site";
import { BatterySocCard } from "./BatterySocCard";
import { EnergyFlowView } from "./EnergyFlowView";
import { OperatingDataPanel } from "./OperatingDataPanel";
import { PlantInfoCard } from "./PlantInfoCard";
import { WeatherCard } from "./WeatherCard";

// recharts dimuat terpisah supaya halaman lain tidak membayar ukurannya.
const OverviewCharts = lazy(() => import("./charts/OverviewCharts"));

// Overview: kolom kiri (aliran energi, operating data, grafik) dan kolom kanan 304 px
// (baterai, informasi plant, cuaca, environmental benefits), mengikuti frame Details-Overview.
export function SiteOverviewPage() {
  const { plant, snapshot } = useSiteContext();
  const today = toDateKey(new Date(), plant?.location.timezone);
  const [period, setPeriod] = useState<Period>({ granularity: "day", date: today });

  // Hook dipanggil sebelum early return; query dimatikan (plantId kosong) bila plant belum ada.
  const daily = useOperatingData({ plantId: plant?.id ?? "", granularity: "day", date: today });
  const performances = usePerformances();
  if (!plant) return null;

  const lifetime = performances.data?.find((p) => p.plantId === plant.id);
  const dailyGen = daily.data ? scaleEnergy(daily.data.pvProductionKWh) : undefined;
  const lifetimeGen = lifetime ? scaleEnergy(lifetime.generationKWh) : undefined;
  const revenue = lifetime ? scaleIDR(lifetime.revenueIDR) : undefined;
  const impact = lifetime ? calculateImpact(lifetime.generationKWh, DEFAULT_EMISSION_FACTORS) : undefined;
  const retryPerformances = () => void performances.refetch();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_304px]">
      <div className="grid min-w-0 content-start gap-4">
        <Panel icon={<Zap className="fill-warn text-warn" />} title="Live Energy Flow" cards>
          <EnergyFlowView plant={plant} snapshot={snapshot} />
          <div className="grid gap-1.5 sm:grid-cols-3">
            <StatCard label="Daily Energy Generation" value={dailyGen?.value} unit={dailyGen?.unit} artwork={energyArt} loading={daily.isPending} error={daily.error} onRetry={() => void daily.refetch()} />
            <StatCard label="Lifetime Energy Production" value={lifetimeGen?.value} unit={lifetimeGen?.unit} artwork={lifetimeArt} loading={performances.isPending} error={performances.error} onRetry={retryPerformances} />
            <StatCard label="Total Revenue" value={revenue && `Rp ${revenue.value}`} unit={revenue?.unit || undefined} artwork={revenueArt} loading={performances.isPending} error={performances.error} onRetry={retryPerformances} />
          </div>
        </Panel>

        <OperatingDataPanel plant={plant} period={period} onPeriodChange={setPeriod} />

        <Suspense
          fallback={
            <Panel icon={<ChartColumn />} title="Charts">
              <Skeleton className="h-72 w-full" />
            </Panel>
          }
        >
          <OverviewCharts plant={plant} />
        </Suspense>
      </div>

      <div className="grid min-w-0 content-start gap-4">
        <BatterySocCard snapshot={snapshot} batteryKWh={plant.capacity.batteryKWh} />
        <PlantInfoCard plant={plant} />
        <WeatherCard plantId={plant.id} />
        <EnvironmentalBenefitsPanel impact={impact} loading={performances.isPending} error={performances.error} onRetry={retryPerformances} />
      </div>
    </div>
  );
}

// Kartu angka di bawah adegan: label, nilai + satuan, ilustrasi 3D di kanan (pola kartu KPI Home).
function StatCard({ label, value, unit, artwork, loading, error, onRetry }: { label: string; value?: string; unit?: string; artwork: string; loading?: boolean; error?: Error | null; onRetry?: () => void }) {
  // Geometri sama dengan kartu KPI Home (Figma energy-generation-card 259×80): ubin 40×40 diputar 41,7° di sudut kanan bawah.
  return (
    <div className="relative h-20 min-w-0 flex-1 overflow-hidden rounded-xl bg-surface">
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
