import { ChartColumn } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useEnergySeries, useTariffSeries } from "@/domains/performance/application/use-performances";
import type { EnergySeriesGranularity, Granularity, Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { useDailyPowerSeries } from "@/domains/telemetry/application/use-power-snapshot";
import { timezoneAbbrev, toDateKey } from "@/shared/domain/time";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { dailyPowerPoints, energyBarPoints, minutesOfDay, tariffPoints } from "../../domain/chart-data";
import { clampWindow, FULL_DAY, type TimeWindow } from "../../domain/period";
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
  const onReset = useCallback(() => setWindow(FULL_DAY), []);

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
      icon={<ChartColumn />}
      title="Charts"
      actions={<PeriodControl period={period} onChange={changePeriod} granularities={CHART_GRANULARITIES} minDate={plant.commissionedAt} today={today} />}
      cards
    >
      {error && (
        <Alert
          tone="danger"
          action={
            <Button size="sm" variant="tertiary" onClick={retry}>
              Try again
            </Button>
          }
        >
          Data grafik tidak bisa dimuat: {error.message}.
        </Alert>
      )}

      {isDay ? (
        <>
          <DailyPowerChart points={dailyPoints} loading={daily.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} window={window} onZoom={onZoom} onReset={onReset} />
          <SocChart points={dailyPoints} loading={daily.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} hasBattery={hasBattery} window={window} onZoom={onZoom} onReset={onReset} />
          <TariffChart points={tariffData} loading={tariff.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} window={window} onZoom={onZoom} onReset={onReset} />
        </>
      ) : (
        <EnergyChart points={energyPoints} loading={energy.isPending} granularity={energyGranularity} />
      )}
    </Panel>
  );
}
