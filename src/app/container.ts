import type { AlarmRepository } from "@/domains/alarm/application/alarm-repository";
import type { AuthRepository } from "@/domains/auth/application/auth-repository";
import { MockAuthRepository } from "@/domains/auth/infrastructure/mock-auth-repository";
import { MockAlarmRepository } from "@/domains/alarm/infrastructure/mock-alarm-repository";
import type { DeviceRepository, DeviceTelemetryRepository } from "@/domains/device/application/device-repository";
import { MockDeviceRepository } from "@/domains/device/infrastructure/mock-device-repository";
import { MockDeviceTelemetryRepository } from "@/domains/device/infrastructure/mock-device-telemetry-repository";
import type { MaintenanceRepository } from "@/domains/maintenance/application/maintenance-repository";
import { MockMaintenanceRepository } from "@/domains/maintenance/infrastructure/mock-maintenance-repository";
import type { PerformanceRepository } from "@/domains/performance/application/performance-repository";
import { MockPerformanceRepository } from "@/domains/performance/infrastructure/mock-performance-repository";
import type { PlantRepository } from "@/domains/plant/application/plant-repository";
import { plantFixtures } from "@/domains/plant/infrastructure/fixtures";
import { MockPlantRepository } from "@/domains/plant/infrastructure/mock-plant-repository";
import type { ScadaRepository } from "@/domains/scada/application/scada-repository";
import { MockScadaRepository } from "@/domains/scada/infrastructure/mock-scada-repository";
import type { TelemetryRepository } from "@/domains/telemetry/application/telemetry-repository";
import { MockTelemetryRepository } from "@/domains/telemetry/infrastructure/mock-telemetry-repository";
import { env } from "@/shared/config/env";

export interface Repositories {
  auth: AuthRepository;
  plant: PlantRepository;
  performance: PerformanceRepository;
  telemetry: TelemetryRepository;
  alarm: AlarmRepository;
  scada: ScadaRepository;
  device: DeviceRepository;
  deviceTelemetry: DeviceTelemetryRepository;
  maintenance: MaintenanceRepository;
}

// Composition root: satu-satunya tempat yang tahu adapter mana yang dipakai.
// Domain hanya mengenal port (interface) masing-masing.
export function createRepositories(): Repositories {
  if (env.dataSource === "http") {
    // TODO: adapter HTTP (pakai shared/lib/apiClient) begitu kontrak API backend tersedia.
    throw new Error("VITE_DATA_SOURCE=http belum didukung; gunakan mock");
  }

  const performance = new MockPerformanceRepository(plantFixtures);
  const telemetry = new MockTelemetryRepository(plantFixtures);
  return {
    // Mock Identity & Access: email valid apa pun + kata sandi ≥ 6 karakter; sesi di localStorage.
    auth: new MockAuthRepository(),
    plant: new MockPlantRepository(plantFixtures),
    performance,
    telemetry,
    alarm: new MockAlarmRepository(plantFixtures),
    scada: new MockScadaRepository(env.scadaUrlTemplate),
    device: new MockDeviceRepository(plantFixtures),
    // Telemetri perangkat diturunkan dari telemetri & performa plant supaya angkanya konsisten.
    deviceTelemetry: new MockDeviceTelemetryRepository(telemetry, performance, plantFixtures),
    // Create/update O&M disimpan di localStorage sebagai lapisan di atas seed.
    maintenance: new MockMaintenanceRepository(plantFixtures),
  };
}
