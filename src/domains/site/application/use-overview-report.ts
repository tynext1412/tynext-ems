import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { usePerformanceRepository } from "@/domains/performance/application/performance-repository-context";
import { performanceKeys } from "@/domains/performance/application/use-performances";
import type { Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { useTelemetryRepository } from "@/domains/telemetry/application/telemetry-repository-context";
import { telemetryKeys } from "@/domains/telemetry/application/use-power-snapshot";
import { downloadXlsx } from "@/shared/lib/xlsx";
import { dailyPowerPoints, energyBarPoints, socTariffPoints, tariffPoints } from "../domain/chart-data";
import { buildOverviewReport, reportFilename } from "../domain/reports";

// "Download report" di section Operating Data: mengambil data periode yang sedang dipilih (dari
// cache query bila grafik sudah memuatnya, kalau belum diambil dari repository) lalu mengunduh
// .xlsx berisi Operating Data + grafik periode itu.
export function useOverviewReport(plant: Plant, period: Period) {
  const queryClient = useQueryClient();
  const performance = usePerformanceRepository();
  const telemetry = useTelemetryRepository();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const download = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const tz = plant.location.timezone;
      const hasBattery = plant.capacity.batteryKWh > 0;
      const query = { plantId: plant.id, ...period };
      const operatingP = queryClient.ensureQueryData({ queryKey: performanceKeys.operating(query), queryFn: () => performance.operatingData(query) });

      let daily, socTariff, energy;
      if (period.granularity === "day") {
        const [series, tariff] = await Promise.all([
          queryClient.ensureQueryData({ queryKey: telemetryKeys.daily(plant.id, period.date), queryFn: () => telemetry.dailySeries(plant.id, period.date) }),
          queryClient.ensureQueryData({ queryKey: performanceKeys.tariff(plant.id, period.date), queryFn: () => performance.tariffSeries(plant.id, period.date) }),
        ]);
        daily = dailyPowerPoints(series, tz);
        socTariff = socTariffPoints(hasBattery ? daily : [], tariffPoints(tariff, tz));
      } else {
        const granularity = period.granularity;
        const buckets = await queryClient.ensureQueryData({
          queryKey: performanceKeys.energy(plant.id, granularity, period.date),
          queryFn: () => performance.energySeries(plant.id, granularity, period.date),
        });
        energy = energyBarPoints(buckets);
      }

      const sheets = buildOverviewReport({
        plant: { id: plant.id, name: plant.name, timezone: tz, commissionedAt: plant.commissionedAt, hasBattery },
        period,
        generatedAt: new Date(),
        operating: await operatingP,
        daily,
        socTariff,
        energy,
      });
      downloadXlsx(reportFilename(plant.id, period), sheets);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setPending(false);
    }
  }, [queryClient, performance, telemetry, plant, period]);

  return { download, pending, error, dismissError: () => setError(null) };
}
