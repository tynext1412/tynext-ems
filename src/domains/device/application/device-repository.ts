import type { PlantId } from "@/domains/plant/domain/plant";
import type { EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import type { DeviceRecord } from "../domain/device";
import type { DeviceEnergyBucket, DeviceReading, DeviceSample } from "../domain/reading";

export interface DeviceRepository {
  findByPlant(plantId: PlantId): Promise<DeviceRecord[]>;
  findById(deviceId: string): Promise<DeviceRecord | null>;
}

export interface DeviceTelemetryRepository {
  // Pembacaan terbaru semua perangkat satu plant (untuk kolom daftar).
  latestForPlant(plantId: PlantId): Promise<Record<string, DeviceReading>>;
  latest(deviceId: string): Promise<DeviceReading | null>;
  // Deret 5 menit parameter "instant" untuk satu tanggal lokal plant.
  dailySeries(deviceId: string, date: string): Promise<DeviceSample[]>;
  // Batang parameter "energy": Month → per hari, Year → per bulan, Lifetime → per tahun.
  energySeries(deviceId: string, granularity: EnergySeriesGranularity, date: string): Promise<DeviceEnergyBucket[]>;
}
