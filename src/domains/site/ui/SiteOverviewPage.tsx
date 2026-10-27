import { lazy, Suspense, useState } from "react";
import { calculateImpact, DEFAULT_EMISSION_FACTORS } from "@/domains/impact/domain/impact";
import { EnvironmentalBenefitsPanel } from "@/domains/impact/ui/EnvironmentalBenefitsPanel";
import { useOperatingData, usePerformances } from "@/domains/performance/application/use-performances";
import type { Period } from "@/domains/performance/domain/performance";
import { BATTERY_STATUS_LABEL, batteryStatus } from "@/domains/telemetry/domain/power-snapshot";
import { toDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy, scaleIDR } from "@/shared/domain/units";
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
  const hasBattery = plant.capacity.batteryKWh > 0;
  const status = snapshot && hasBattery ? batteryStatus(snapshot.batteryKW) : undefined;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-4">
        <Panel
          title="Aliran energi saat ini"
          actions={
            status && (
              <span className="text-sm text-muted">
                Battery status: <span className="font-medium text-text">{BATTERY_STATUS_LABEL[status]}</span>
                {status !== "IDLE" && snapshot && <span className="font-mono text-text"> {formatNumber(Math.abs(snapshot.batteryKW), 1)} kW</span>}
              </span>
            )
          }
        >
          <EnergyFlowView
            plant={plant}
            snapshot={snapshot}
            stats={
              <>
                <MainTile label="Daily Energy Generation" value={dailyGen?.value} unit={dailyGen?.unit} loading={daily.isPending} />
                <MainTile label="Lifetime Energy Production" value={lifetimeGen?.value} unit={lifetimeGen?.unit} loading={performances.isPending} />
                <MainTile label="Total Revenue" value={revenue && `Rp ${revenue.value}`} unit={revenue?.unit} loading={performances.isPending} />
              </>
            }
          />
        </Panel>

        <OperatingDataPanel plant={plant} period={period} onPeriodChange={setPeriod} />

        <Suspense
          fallback={
            <Panel title="Grafik">
              <Skeleton className="h-70 w-full" />
            </Panel>
          }
        >
          <OverviewCharts plant={plant} />
        </Suspense>
      </div>

      <div className="grid content-start gap-4">
        <BatterySocCard snapshot={snapshot} batteryKWh={plant.capacity.batteryKWh} />
        <PlantInfoCard plant={plant} />
        <WeatherCard plantId={plant.id} />
        <EnvironmentalBenefitsPanel impact={impact} loading={performances.isPending} className="w-full" />
      </div>
    </div>
  );
}

// Kotak angka harian: menumpang di sisi kanan adegan 3D (ditumpuk) atau tiga kolom di bawah diagram.
function MainTile({ label, value, unit, loading }: { label: string; value?: string; unit?: string; loading?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface/95 px-4 py-3">
      {loading || value === undefined ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="font-mono text-2xl font-semibold leading-tight">
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-muted">{unit}</span>}
        </div>
      )}
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
