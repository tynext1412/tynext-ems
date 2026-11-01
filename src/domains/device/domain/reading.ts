// Pembacaan real-time per perangkat (nilai terbaru) dan deret untuk chart.

export interface PhaseReading {
  name: string; // L1, L2, L3
  voltageV: number;
  currentA: number;
  frequencyHz: number;
}

// Semua parameter real-time mengikuti "EMS Parameter List" (sheet Device RealTime), kecuali PCS.

// Run State (enum 0/1) dipakai String Inverter, C&I ESS, meter, dan EMI.
export type RunState = "CONNECTED" | "DISCONNECTED"; // 1 = Connected, 0 = Disconnected

export const RUN_STATE_LABEL: Record<RunState, string> = { CONNECTED: "Connected", DISCONNECTED: "Disconnected" };

export type InverterRunState = RunState;
export type GridConnectionStatus = "ON_GRID" | "OFF_GRID";

export interface InverterPhaseReading {
  name: "A" | "B" | "C";
  voltageV: number; // tegangan fasa
  currentA: number; // arus fasa
}

export interface InverterReading {
  kind: "INVERTER";
  deviceId: string;
  at: string;
  statusCode: number; // Inverter Status: kode status operasi dari vendor (lihat inverter-status.ts)
  runState: InverterRunState;
  gridConnection: GridConnectionStatus; // Grid Connection Status / Off-grid status
  lineVoltageV: { ab: number; bc: number; ca: number }; // Grid Line Voltage AB/BC/CA
  phases: InverterPhaseReading[]; // Phase A/B/C Voltage & Current
  powerFactor: number;
  gridFrequencyHz: number;
  activePowerKW: number;
  reactivePowerKvar: number;
  apparentPowerKVA: number;
  yieldTodayKWh: number;
  totalYieldKWh: number;
  totalDcInputKWh: number; // Total DC Input Energy
  ratedPowerKW: number;
}

export type BatteryOperatingStatus = "CHARGING" | "DISCHARGING" | "IDLE";

// C&I ESS (perangkat Battery).
export type EssWorkingMode = "SELF_CONSUMPTION" | "PEAK_SHAVING" | "TIME_OF_USE" | "BACKUP" | "MANUAL";
export type HvacStatus = "COOLING" | "HEATING" | "STANDBY" | "FAULT";
export type FireSuppressionStatus = "NORMAL" | "ALARM" | "FAULT";

export const ESS_WORKING_MODE_LABEL: Record<EssWorkingMode, string> = {
  SELF_CONSUMPTION: "Self-consumption",
  PEAK_SHAVING: "Peak shaving",
  TIME_OF_USE: "Time-of-use",
  BACKUP: "Backup",
  MANUAL: "Manual",
};
export const HVAC_STATUS_LABEL: Record<HvacStatus, string> = { COOLING: "Cooling", HEATING: "Heating", STANDBY: "Standby", FAULT: "Fault" };
export const FIRE_SUPPRESSION_LABEL: Record<FireSuppressionStatus, string> = { NORMAL: "Normal", ALARM: "Alarm", FAULT: "Fault" };

export interface RackReading {
  name: string; // Rack 1, Rack 2, …
  socPercent: number;
  voltageV: number;
  currentA: number; // + charge, − discharge
}

export interface BatteryReading {
  kind: "BATTERY";
  deviceId: string;
  at: string;
  operatingStatus: BatteryOperatingStatus; // turunan dari tanda Charge/Discharge Power
  chargeDischargePowerKW: number; // + charge, − discharge
  socPercent: number;
  sohPercent: number;
  workingMode: EssWorkingMode;
  runState: RunState;
  // Charge Energy / Discharge Energy per periode (perangkat melaporkan energi harian; bulan/tahun dijumlahkan).
  chargeEnergyTodayKWh: number;
  dischargeEnergyTodayKWh: number;
  chargeEnergyMonthKWh: number;
  dischargeEnergyMonthKWh: number;
  chargeEnergyYearKWh: number;
  dischargeEnergyYearKWh: number;
  racks: RackReading[];
  maxCellVoltageV: number;
  minCellVoltageV: number;
  maxCellTempC: number;
  minCellTempC: number;
  pcsActivePowerKW: number;
  pcsReactivePowerKvar: number;
  chargeableEnergyKWh: number;
  dischargeableEnergyKWh: number;
  ratedCapacityKWh: number;
  hvacStatus: HvacStatus; // Thermal Mgmt (HVAC) Status
  fireSuppressionStatus: FireSuppressionStatus;
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

// Meter: STG/DEG/ESS/PV/Load memakai parameter "Grid Meter"; Power Sensor memakai parameter
// "Power Sensor" (tanpa daya reaktif per fasa dan daya semu, ada Meter Status). Daya ditampilkan
// dalam kW/kvar walau API mengirim Active Power dalam W dan Reactive Power dalam var.
export type MeterStatus = "NORMAL" | "OFFLINE"; // Power Sensor: 1 = Normal, 0 = Offline

export const METER_STATUS_LABEL: Record<MeterStatus, string> = { NORMAL: "Normal", OFFLINE: "Offline" };

export interface MeterPhaseReading {
  name: "A" | "B" | "C";
  voltageV: number;
  currentA: number;
  activePowerKW: number;
  reactivePowerKvar?: number; // hanya Grid Meter
}

export interface MeterReading {
  kind: "METER";
  deviceId: string;
  at: string;
  runState: RunState;
  meterStatus?: MeterStatus; // hanya Power Sensor
  activePowerKW: number; // tanda mengikuti konfigurasi meter (mis. STG: + impor, − ekspor)
  reactivePowerKvar: number;
  apparentPowerKVA?: number; // Total Apparent Power, hanya Grid Meter
  powerFactor: number;
  gridFrequencyHz: number;
  lineVoltageV: { ab: number; bc: number; ca: number };
  phases: MeterPhaseReading[];
  // Penghitung kumulatif.
  forwardActiveEnergyKWh: number; // Active Energy (Forward) / Positive Active Energy
  reverseActiveEnergyKWh: number;
  forwardReactiveEnergyKvarh: number;
  reverseReactiveEnergyKvarh: number;
  // Energi hari ini (selisih penghitung sejak 00:00), untuk kolom daftar.
  forwardActiveEnergyTodayKWh: number;
  reverseActiveEnergyTodayKWh: number;
}

// EMI / Weather Station.
export interface EmiReading {
  kind: "EMI";
  deviceId: string;
  at: string;
  runState: RunState;
  ambientTempC: number;
  moduleTempC: number;
  windSpeedMs: number;
  windDirectionDeg: number;
  irradiancePoaWm2: number;
  horizontalIrradianceWm2: number;
  dailyIrradiationPoaKWhM2: number;
  dailyHorizontalIrradiationKWhM2: number;
}

export type DeviceReading = InverterReading | BatteryReading | PcsReading | MeterReading | EmiReading;

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
