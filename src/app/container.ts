import type { AlarmRepository } from "@/domains/alarm/application/alarm-repository";
import { MockAlarmRepository } from "@/domains/alarm/infrastructure/mock-alarm-repository";
import type { PerformanceRepository } from "@/domains/performance/application/performance-repository";
import { MockPerformanceRepository } from "@/domains/performance/infrastructure/mock-performance-repository";
import type { PlantRepository } from "@/domains/plant/application/plant-repository";
import { plantFixtures } from "@/domains/plant/infrastructure/fixtures";
import { MockPlantRepository } from "@/domains/plant/infrastructure/mock-plant-repository";
import type { TelemetryRepository } from "@/domains/telemetry/application/telemetry-repository";
import { MockTelemetryRepository } from "@/domains/telemetry/infrastructure/mock-telemetry-repository";
import { env } from "@/shared/config/env";

export interface Repositories {
  plant: PlantRepository;
  performance: PerformanceRepository;
  telemetry: TelemetryRepository;
  alarm: AlarmRepository;
}

// Composition root: satu-satunya tempat yang tahu adapter mana yang dipakai.
// Domain hanya mengenal port (interface) masing-masing.
export function createRepositories(): Repositories {
  if (env.dataSource === "http") {
    // TODO: adapter HTTP (pakai shared/lib/apiClient) begitu kontrak API backend tersedia.
    throw new Error("VITE_DATA_SOURCE=http belum didukung; gunakan mock");
  }

  return {
    plant: new MockPlantRepository(plantFixtures),
    performance: new MockPerformanceRepository(plantFixtures),
    telemetry: new MockTelemetryRepository(plantFixtures),
    alarm: new MockAlarmRepository(plantFixtures),
  };
}
