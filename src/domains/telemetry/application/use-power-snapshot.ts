import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PlantId } from "@/domains/plant/domain/plant";
import { useTelemetryRepository } from "./telemetry-repository-context";

const LIVE_REFRESH_MS = 5_000;
const SERIES_REFRESH_MS = 60_000;

export const telemetryKeys = {
  latest: (plantId: PlantId) => ["telemetry", plantId, "latest"] as const,
  daily: (plantId: PlantId, date: string) => ["telemetry", plantId, "daily", date] as const,
};

export function usePowerSnapshot(plantId: PlantId) {
  const repository = useTelemetryRepository();
  return useQuery({
    queryKey: telemetryKeys.latest(plantId),
    queryFn: () => repository.latest(plantId),
    enabled: plantId !== "",
    refetchInterval: LIVE_REFRESH_MS,
    staleTime: 0,
  });
}

export function useDailyPowerSeries(plantId: PlantId, date: string, isToday: boolean) {
  const repository = useTelemetryRepository();
  return useQuery({
    queryKey: telemetryKeys.daily(plantId, date),
    queryFn: () => repository.dailySeries(plantId, date),
    enabled: plantId !== "",
    refetchInterval: isToday ? SERIES_REFRESH_MS : false,
    placeholderData: keepPreviousData, // ganti tanggal tanpa kedip ke skeleton
  });
}
