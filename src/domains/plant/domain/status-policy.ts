import type { Device, Plant, PlantStatus } from "./plant";

// StatusPolicy (sesuai spesifikasi dashboard):
//   OFFLINE : semua device terputus (atau belum ada device)
//   ALARM   : ada alarm aktif, atau sebagian (tidak semua) device terputus
//   ONLINE  : semua device terhubung dan tidak ada alarm aktif
export function derivePlantStatus(devices: readonly Device[]): PlantStatus {
  const connected = devices.filter((d) => d.connected).length;
  const hasAlarm = devices.some((d) => d.activeAlarms > 0);

  if (connected === 0) return "OFFLINE";
  if (hasAlarm || connected < devices.length) return "ALARM";
  return "ONLINE";
}

export interface InverterAvailability {
  online: number;
  total: number;
}

export function inverterAvailability(devices: readonly Device[]): InverterAvailability {
  const inverters = devices.filter((d) => d.type === "INVERTER");
  return {
    online: inverters.filter((d) => d.connected).length,
    total: inverters.length,
  };
}

// "Active site" di kartu TOTAL SITES = plant yang tidak OFFLINE.
export function isActive(status: PlantStatus): boolean {
  return status !== "OFFLINE";
}

export type StatusCount = Record<PlantStatus, number>;

export function countByStatus(plants: readonly Pick<Plant, "status">[]): StatusCount {
  const count: StatusCount = { ONLINE: 0, ALARM: 0, OFFLINE: 0 };
  for (const p of plants) count[p.status] += 1;
  return count;
}
