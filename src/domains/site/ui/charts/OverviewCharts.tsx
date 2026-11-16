import { useCallback, useMemo, useState } from "react";
import { useEnergySeries, useTariffSeries } from "@/domains/performance/application/use-performances";
import type { Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { useOutageBands } from "@/domains/outage/application/use-outages";
import { useDailyPowerSeries } from "@/domains/telemetry/application/use-power-snapshot";
import { timezoneAbbrev, toDateKey } from "@/shared/domain/time";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { dailyPowerPoints, energyBarPoints, minutesOfDay, socTariffPoints, tariffPoints } from "../../domain/chart-data";
import { clampWindow, FULL_DAY, type TimeWindow } from "../../domain/period";
import { DailyPowerChart } from "./DailyPowerChart";
import { EnergyChart } from "./EnergyChart";
import { SocTariffChart } from "./SocTariffChart";

interface Props {
  plant: Plant;
  // Periode dari filter section Operating Data. Komponen ini di-mount ulang (key) saat periode
  // berganti, jadi rentang zoom tidak terbawa ke tanggal lain.
  period: Period;
}

// Grafik di bawah kartu Operating Data, mengikuti filter yang sama: Day → daya 5 menit serta
// SOC & tarif dengan zoom bersama; Month/Year/Lifetime → batang energi berkelompok per hari/bulan/tahun.
export default function OverviewCharts({ plant, period }: Props) {
  const tz = plant.location.timezone;
  const abbrev = timezoneAbbrev(tz);
  const today = toDateKey(new Date(), tz);
  const hasBattery = plant.capacity.batteryKWh > 0;

  const [window, setWindow] = useState<TimeWindow>(FULL_DAY);
  const onZoom = useCallback((from: number, to: number) => setWindow(clampWindow(from, to)), []);
  const onReset = useCallback(() => setWindow(FULL_DAY), []);

  const isDay = period.granularity === "day";
  const isToday = isDay && period.date === today;
  const energyGranularity = period.granularity === "day" ? "month" : period.granularity;

  const daily = useDailyPowerSeries(isDay ? plant.id : "", period.date, isToday);
  const tariff = useTariffSeries(isDay ? plant.id : "", period.date);
  const energy = useEnergySeries(isDay ? "" : plant.id, energyGranularity, period.date);

  const dailyPoints = useMemo(() => (daily.data ? dailyPowerPoints(daily.data, tz) : undefined), [daily.data, tz]);
  const socTariff = useMemo(
    () => (dailyPoints && tariff.data ? socTariffPoints(hasBattery ? dailyPoints : [], tariffPoints(tariff.data, tz)) : undefined),
    [dailyPoints, tariff.data, tz, hasBattery],
  );
  const outages = useOutageBands(isDay ? plant.id : "", period.date, tz);
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
    <>
      {error && (
        <Alert
          tone="danger"
          action={
            <Button size="sm" variant="tertiary" onClick={retry}>
              Try again
            </Button>
          }
        >
          Chart data couldn't load: {error.message}.
        </Alert>
      )}

      {isDay ? (
        <>
          <DailyPowerChart points={dailyPoints} loading={daily.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} window={window} onZoom={onZoom} onReset={onReset} outages={outages} />
          <SocTariffChart points={socTariff} loading={daily.isPending || tariff.isPending} nowMinutes={nowMinutes} timezoneAbbrev={abbrev} hasBattery={hasBattery} window={window} onZoom={onZoom} onReset={onReset} outages={outages} />
        </>
      ) : (
        <EnergyChart points={energyPoints} loading={energy.isPending} granularity={energyGranularity} hasBattery={hasBattery} />
      )}
    </>
  );
}
