import type { AlarmRepository } from "@/domains/alarm/application/alarm-repository";
import type { AuthRepository } from "@/domains/auth/application/auth-repository";
import { authKeys } from "@/domains/auth/application/use-auth";
import { HttpAuthRepository } from "@/domains/auth/infrastructure/http-auth-repository";
import { HttpAlarmRepository } from "@/domains/alarm/infrastructure/http-alarm-repository";
import type { DeviceRepository, DeviceTelemetryRepository } from "@/domains/device/application/device-repository";
import { HttpDeviceRepository, HttpDeviceTelemetryRepository } from "@/domains/device/infrastructure/http-device-repository";
import type { MaintenanceRepository } from "@/domains/maintenance/application/maintenance-repository";
import { HttpMaintenanceRepository } from "@/domains/maintenance/infrastructure/http-maintenance-repository";
import type { PerformanceRepository } from "@/domains/performance/application/performance-repository";
import { HttpPerformanceRepository } from "@/domains/performance/infrastructure/http-performance-repository";
import type { PlantRepository } from "@/domains/plant/application/plant-repository";
import { HttpPlantRepository } from "@/domains/plant/infrastructure/http-plant-repository";
import type { ScadaRepository } from "@/domains/scada/application/scada-repository";
import { HttpScadaRepository } from "@/domains/scada/infrastructure/http-scada-repository";
import type { TelemetryRepository } from "@/domains/telemetry/application/telemetry-repository";
import { HttpTelemetryRepository } from "@/domains/telemetry/infrastructure/http-telemetry-repository";
import { env } from "@/shared/config/env";
// Data lama (mock + fixture 14 plant) tidak dipakai lagi; semua data dari backend. Import-nya dikomentari, file mock tidak dihapus.
// import { MockAuthRepository } from "@/domains/auth/infrastructure/mock-auth-repository";
// import { MockAlarmRepository } from "@/domains/alarm/infrastructure/mock-alarm-repository";
// import { MockDeviceRepository } from "@/domains/device/infrastructure/mock-device-repository";
// import { MockDeviceTelemetryRepository } from "@/domains/device/infrastructure/mock-device-telemetry-repository";
// import { MockMaintenanceRepository } from "@/domains/maintenance/infrastructure/mock-maintenance-repository";
// import { MockPerformanceRepository } from "@/domains/performance/infrastructure/mock-performance-repository";
// import { plantFixtures } from "@/domains/plant/infrastructure/fixtures";
// import { MockPlantRepository } from "@/domains/plant/infrastructure/mock-plant-repository";
// import { MockScadaRepository } from "@/domains/scada/infrastructure/mock-scada-repository";
// import { MockTelemetryRepository } from "@/domains/telemetry/infrastructure/mock-telemetry-repository";
import { apiClient, type ApiClient } from "@/shared/lib/apiClient";
import { queryClient } from "@/shared/lib/queryClient";

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
// Domain hanya mengenal port (interface) masing-masing. Semua data dari endpoint backend (tynext-mqtt).
export function createRepositories(): Repositories {
  // 401 dari endpoint mana pun = sesi habis: sesi dikosongkan, RequireAuth menampilkan "Your session has ended".
  apiClient.setUnauthorizedHandler(() => queryClient.setQueryData(authKeys.session, null));
  return createHttpRepositories(apiClient);

  // Data lama (mock), dinonaktifkan dan diganti endpoint backend di atas. Tidak dihapus supaya bisa dipakai lagi untuk demo offline.
  // if (env.dataSource === "mock") {
  //   const performance = new MockPerformanceRepository(plantFixtures);
  //   const telemetry = new MockTelemetryRepository(plantFixtures);
  //   return {
  //     // Mock Identity & Access: email valid apa pun + kata sandi ≥ 10 karakter; sesi di localStorage.
  //     auth: new MockAuthRepository(),
  //     plant: new MockPlantRepository(plantFixtures),
  //     performance,
  //     telemetry,
  //     alarm: new MockAlarmRepository(plantFixtures),
  //     scada: new MockScadaRepository(env.scadaUrlTemplate),
  //     device: new MockDeviceRepository(plantFixtures),
  //     // Telemetri perangkat diturunkan dari telemetri & performa plant supaya angkanya konsisten.
  //     deviceTelemetry: new MockDeviceTelemetryRepository(telemetry, performance, plantFixtures),
  //     // Create/update O&M disimpan di localStorage sebagai lapisan di atas seed.
  //     maintenance: new MockMaintenanceRepository(plantFixtures),
  //   };
  // }
}

// Adapter HTTP sesuai kontrak backend (tynext-mqtt: docs/prompts/backend-dashboard-api.openapi.yaml).
export function createHttpRepositories(api: ApiClient): Repositories {
  return {
    auth: new HttpAuthRepository(api),
    plant: new HttpPlantRepository(api),
    performance: new HttpPerformanceRepository(api),
    telemetry: new HttpTelemetryRepository(api),
    alarm: new HttpAlarmRepository(api),
    scada: new HttpScadaRepository(api, env.scadaUrlTemplate),
    device: new HttpDeviceRepository(api),
    deviceTelemetry: new HttpDeviceTelemetryRepository(api),
    maintenance: new HttpMaintenanceRepository(api),
  };
}
