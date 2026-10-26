import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useEnergySeries, useTariffSeries } from "@/domains/performance/application/use-performances";
import type { EnergySeriesGranularity, Granularity, Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { useDailyPowerSeries } from "@/domains/telemetry/application/use-power-snapshot";
import { timezoneAbbrev, toDateKey } from "@/shared/domain/time";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { dailyPowerPoints, energyBarPoints, formatMinutes, minutesOfDay, tariffPoints } from "../../domain/chart-data";
import { clampWindow, FULL_DAY, isFullDay, zoomIn, zoomOut, type TimeWindow } from "../../domain/period";
import { PeriodControl } from "../PeriodControl";
import { DailyPowerChart } from "./DailyPowerChart";
import { EnergyChart } from "./EnergyChart";
import { SocChart } from "./SocChart";
import { TariffChart } from "./TariffChart";

// Grafik punya filter periodenya sendiri (Day/Month/Year): Day → daya 5 menit,
// SOC, tarif dengan zoom bersama; Month/Year → energi per hari/bulan.
const CHART_GRANULARITIES: readonly Granularity[] = ["day", "month", "year"];

export default function OverviewCharts({ plant }: { plant: Plant }) {
  const tz = plant.location.timezone;
  const abbrev = timezoneAbbrev(tz);
  const today = toDateKey(new Date(), tz);
  const hasBattery = plant.capacity.batteryKWh > 0;

  const [period, setPeriod] = useState<Period>({ granularity: "day", date: today });
  const [window, setWindow] = useState<TimeWindow>(FULL_DAY);
  const changePeriod = useCallback((p: Period) => {
    setPeriod(p);
    setWindow(FULL_DAY); // rentang zoom tidak dibawa ke tanggal lain
  }, []);
  const onZoom = useCallback((from: number, to: number) => setWindow(clampWindow(from, to)), []);

  const isDay = period.granularity === "day";
  const isToday = isDay && period.date === today;
  const energyGranularity: EnergySeriesGranularity = period.granularity === "day" ? "month" : period.granularity;

  const daily = useDailyPowerSeries(isDay ? plant.id : "", period.date, isToday);
  const tariff = useTariffSeries(isDay ? plant.id : "", period.date);
  const energy = useEnergySeries(isDay ? "" : plant.id, energyGranularity, period.date);

  const dailyPoints = useMemo(() => (daily.data ? dailyPowerPoints(daily.data, tz) : undefined), [daily.data, tz]);
  const tariffData = useMemo(() => (tariff.data ? tariffPoints(tariff.data, tz) : undefined), [tariff.data, tz]);
  const energyPoints = useMemo(() => (energy.data ? energyBarPoints(energy.data) : undefined), [energy.data]);
  const nowMinutes = isToday ? minutesOfDay(new Date().toISOString(), tz) : undefined;

  const error = isDay ? (daily.error ?? tariff.error) : energy.error;
  const retry = () => {
    if (isDay) {
      void daily.refetch();
      void tariff.refetch();
    } else {
      void energy.refetch();
    }
  };

  return (
    <Panel
      title="Grafik"
      actions={<PeriodControl period={period} onChange={changePeriod} granularities={CHART_GRANULARITIES} minDate={plant.commissionedAt} today={today} />}
    >
      {error && (
        <div role="alert" className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span>Data grafik tidak bisa dimuat: {error.message}.</span>
          <Button onClick={retry} className="h-9">
            Coba muat ulang
          </Button>
        </div>
      )}

      {isDay ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted" role="group" aria-label="Zoom sumbu waktu">
            <span>
              Rentang <span className="font-mono text-text">{formatMinutes(window[0])}–{formatMinutes(window[1])}</span>
              {isFullDay(window) && " · seret di grafik untuk memperbesar"}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Button variant="ghost" className="size-9 px-0" onClick={() => setWindow((w) => zoomIn(w))} aria-label="Perbesar rentang waktu">
                <ZoomIn className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" className="size-9 px-0" disabled={isFullDay(window)} onClick={() => setWindow((w) => zoomOut(w))} aria-label="Perkecil rentang waktu">
                <ZoomOut className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" className="h-9" disabled={isFullDay(window)} onClick={() => setWindow(FULL_DAY)}>
                <RotateCcw className="size-4" aria-hidden />
                Reset zoom
              </Button>
            </span>
          </div>
          <DailyPowerChart points={dailyPoints} loading={daily.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} window={window} onZoom={onZoom} />
          <SocChart points={dailyPoints} loading={daily.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} hasBattery={hasBattery} window={window} onZoom={onZoom} />
          <TariffChart points={tariffData} loading={tariff.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} window={window} onZoom={onZoom} />
        </div>
      ) : (
        <EnergyChart points={energyPoints} loading={energy.isPending} granularity={energyGranularity} />
      )}
    </Panel>
  );
}
