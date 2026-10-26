import type { PlantId } from "@/domains/plant/domain/plant";
import type { KW } from "@/shared/domain/units";

// Satu titik daya. Tanda mengikuti spesifikasi dashboard:
//   batteryKW > 0 = charge (mengisi),  < 0 = discharge (menyuplai beban)
//   gridKW    > 0 = impor dari grid,   < 0 = ekspor ke grid
export interface PowerSample {
  at: string; // ISO 8601
  pvKW: KW;
  loadKW: KW;
  gensetKW: KW;
  batteryKW: KW;
  gridKW: KW;
  socPercent: number;
}

// Snapshot daya sesaat satu plant (titik terbaru).
export interface PowerSnapshot extends PowerSample {
  plantId: PlantId;
}

export type BatteryStatus = "CHARGING" | "DISCHARGING" | "IDLE";

export const BATTERY_STATUS_LABEL: Record<BatteryStatus, string> = {
  CHARGING: "Charging",
  DISCHARGING: "Discharging",
  IDLE: "Idle",
};

const EPSILON = 0.05; // kW

export function batteryStatus(batteryKW: KW): BatteryStatus {
  if (batteryKW > EPSILON) return "CHARGING";
  if (batteryKW < -EPSILON) return "DISCHARGING";
  return "IDLE";
}
