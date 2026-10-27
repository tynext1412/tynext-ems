import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PlantId } from "@/domains/plant/domain/plant";
import type { EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import { useDeviceRepositories } from "./device-repository-context";

const LIVE_REFRESH_MS = 10_000;

export const deviceKeys = {
  byPlant: (plantId: PlantId) => ["devices", plantId] as const,
  detail: (deviceId: string) => ["devices", "detail", deviceId] as const,
  readings: (plantId: PlantId) => ["devices", plantId, "readings"] as const,
  reading: (deviceId: string) => ["devices", "detail", deviceId, "reading"] as const,
  daily: (deviceId: string, date: string) => ["devices", "detail", deviceId, "daily", date] as const,
  energy: (deviceId: string, g: EnergySeriesGranularity, date: string) => ["devices", "detail", deviceId, "energy", g, date] as const,
};

export function usePlantDevices(plantId: PlantId) {
  const { devices } = useDeviceRepositories();
  return useQuery({ queryKey: deviceKeys.byPlant(plantId), queryFn: () => devices.findByPlant(plantId), enabled: plantId !== "" });
}

export function useDevice(deviceId: string) {
  const { devices } = useDeviceRepositories();
  return useQuery({ queryKey: deviceKeys.detail(deviceId), queryFn: () => devices.findById(deviceId), enabled: deviceId !== "" });
}

export function usePlantDeviceReadings(plantId: PlantId) {
  const { telemetry } = useDeviceRepositories();
  return useQuery({
    queryKey: deviceKeys.readings(plantId),
    queryFn: () => telemetry.latestForPlant(plantId),
    enabled: plantId !== "",
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useDeviceReading(deviceId: string) {
  const { telemetry } = useDeviceRepositories();
  return useQuery({
    queryKey: deviceKeys.reading(deviceId),
    queryFn: () => telemetry.latest(deviceId),
    enabled: deviceId !== "",
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useDeviceDailySeries(deviceId: string, date: string, isToday: boolean) {
  const { telemetry } = useDeviceRepositories();
  return useQuery({
    queryKey: deviceKeys.daily(deviceId, date),
    queryFn: () => telemetry.dailySeries(deviceId, date),
    enabled: deviceId !== "",
    refetchInterval: isToday ? 60_000 : false,
    placeholderData: keepPreviousData,
  });
}

export function useDeviceEnergySeries(deviceId: string, granularity: EnergySeriesGranularity, date: string) {
  const { telemetry } = useDeviceRepositories();
  return useQuery({
    queryKey: deviceKeys.energy(deviceId, granularity, date),
    queryFn: () => telemetry.energySeries(deviceId, granularity, date),
    enabled: deviceId !== "",
    placeholderData: keepPreviousData,
  });
}
