// Pembacaan real-time per perangkat (nilai terbaru) dan deret untuk chart.

export interface StringReading {
  name: string; // PV1, PV2, …
  voltageV: number;
  currentA: number;
  powerW: number;
}

export interface PhaseReading {
  name: string; // L1, L2, L3
  voltageV: number;
  currentA: number;
  frequencyHz: number;
}

export interface InverterReading {
  kind: "INVERTER";
  deviceId: string;
  at: string;
  powerKW: number;
  dailyYieldKWh: number;
  totalYieldKWh: number;
  dailyFullLoadHours: number;
  internalTempC: number;
  strings: StringReading[];
  phases: PhaseReading[];
}

export type BatteryOperatingStatus = "CHARGING" | "DISCHARGING" | "IDLE";

export interface BatteryReading {
  kind: "BATTERY";
  deviceId: string;
  at: string;
  socPercent: number;
  operatingStatus: BatteryOperatingStatus;
  voltageV: number;
  currentA: number;
  powerKW: number; // + charge, − discharge (spesifikasi)
  dailyChargeKWh: number;
  dailyDischargeKWh: number;
  monthChargeKWh: number;
  monthDischargeKWh: number;
  yearChargeKWh: number;
  yearDischargeKWh: number;
  minCellVoltageV: number;
  maxCellVoltageV: number;
  minCellTempC: number;
  maxCellTempC: number;
  cycleCount: number;
}

export interface PcsReading {
  kind: "PCS";
  deviceId: string;
  at: string;
  operatingStatus: BatteryOperatingStatus; // mengikuti arah daya baterai yang dilayani
  powerKW: number; // + charge (AC→DC), − discharge (DC→AC)
  dcVoltageV: number;
  dcCurrentA: number;
  internalTempC: number;
  efficiencyPercent: number;
  phases: PhaseReading[];
  dailyChargeKWh: number;
  dailyDischargeKWh: number;
  totalChargeKWh: number;
  totalDischargeKWh: number;
}

export interface MeterReading {
  kind: "METER";
  deviceId: string;
  at: string;
  activePowerKW: number; // + impor, − ekspor
  dailyImportKWh: number;
  dailyExportKWh: number;
  phases: PhaseReading[];
  powerFactor: number;
}

export type DeviceReading = InverterReading | BatteryReading | PcsReading | MeterReading;

// Satu sampel deret 5 menit: nilai per kunci parameter (lihat parameters.ts).
export interface DeviceSample {
  at: string;
  values: Record<string, number>;
}

// Satu batang energi per hari/bulan/tahun untuk parameter berjenis "energy".
export interface DeviceEnergyBucket {
  key: string; // YYYY-MM-DD | YYYY-MM | YYYY
  values: Record<string, number>;
}
