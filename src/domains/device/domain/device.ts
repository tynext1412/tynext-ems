import type { MeterType, PlantId } from "@/domains/plant/domain/plant";

export type { MeterType };

// Tipe perangkat di menu Device: inverter (string inverter), baterai (C&I ESS), PCS (power
// conversion system), meter (beberapa jenis), dan EMI / weather station.
export type DeviceKind = "INVERTER" | "BATTERY" | "PCS" | "METER" | "EMI";

export const DEVICE_KINDS: readonly DeviceKind[] = ["INVERTER", "BATTERY", "PCS", "METER", "EMI"];

export const DEVICE_KIND_LABEL: Record<DeviceKind, string> = {
  INVERTER: "Inverter",
  BATTERY: "Battery",
  PCS: "PCS",
  METER: "Meter",
  EMI: "EMI / Weather Station",
};

export const METER_TYPES: readonly MeterType[] = ["STG", "DEG", "ESS", "PV", "LOAD", "POWER_SENSOR"];

export const METER_TYPE_LABEL: Record<MeterType, string> = {
  STG: "STG Meter",
  DEG: "DEG Meter",
  ESS: "ESS Meter",
  PV: "PV Meter",
  LOAD: "Load Meter",
  POWER_SENSOR: "Power Sensor",
};

export type DeviceStatus = "ONLINE" | "ALARM" | "OFFLINE";

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  ONLINE: "Online",
  ALARM: "Alarm",
  OFFLINE: "Offline",
};

interface DeviceBase {
  id: string;
  plantId: PlantId;
  plantName: string;
  name: string;
  serialNumber: string;
  vendor: string;
  model: string;
  dataloggerId: string; // datalogger yang menghubungkan perangkat ke platform
  address: number; // alamat Modbus
  connected: boolean;
  activeAlarms: number;
  firmwareVersion: string;
  commissionedAt: string; // YYYY-MM-DD
  photoUrl?: string; // foto produk dari vendor/backend; tanpa ini UI memakai ilustrasi per tipe
}

export interface InverterRecord extends DeviceBase {
  kind: "INVERTER";
  series: string;
  ratedPowerKW: number;
  warrantyExpiresAt: string; // YYYY-MM-DD
  nationalStandard: string;
  stringCount: number;
  isMaster: boolean;
}

export interface BatteryRecord extends DeviceBase {
  kind: "BATTERY";
  batteryType: string; // mis. Lithium (LFP) HV
  capacityKWh: number;
  maxChargeCurrentA: number;
  maxDischargeCurrentA: number;
  packCount: number;
  modulesInSeries: number;
  parallelConnections: number;
  rackCount: number; // rak baterai dalam satu kabinet C&I ESS
}

// PCS: konverter dua arah AC↔DC untuk BESS; satu PCS melayani satu atau lebih unit baterai.
export interface PcsRecord extends DeviceBase {
  kind: "PCS";
  series: string;
  ratedPowerKW: number;
  maxChargeKW: number;
  maxDischargeKW: number;
  acVoltage: string; // mis. 230/400 V 3P
  dcVoltageMinV: number;
  dcVoltageMaxV: number;
  coupling: "AC" | "DC";
  coupledBatteryIds: string[];
  warrantyExpiresAt: string; // YYYY-MM-DD
}

export interface MeterRecord extends DeviceBase {
  kind: "METER";
  meterType: MeterType;
  originalSerialNumber?: string; // SN dari pabrikan bila berbeda dari SN platform
}

// EMI / weather station: sensor iradiasi (bidang modul/POA dan horizontal), suhu, dan angin.
export interface EmiRecord extends DeviceBase {
  kind: "EMI";
  poaTiltDeg: number; // kemiringan sensor POA, sama dengan modul
  poaAzimuthDeg: number;
}

export type DeviceRecord = InverterRecord | BatteryRecord | PcsRecord | MeterRecord | EmiRecord;

// Nama tipe untuk judul/chip: meter memakai jenisnya (mis. "PV Meter").
export function deviceTypeLabel(d: Pick<DeviceRecord, "kind"> & { meterType?: MeterType }): string {
  return d.kind === "METER" && d.meterType ? METER_TYPE_LABEL[d.meterType] : DEVICE_KIND_LABEL[d.kind];
}

// Status perangkat: terputus → OFFLINE; terhubung dengan alarm → ALARM; selain itu ONLINE.
export function deviceStatus(d: Pick<DeviceRecord, "connected" | "activeAlarms">): DeviceStatus {
  if (!d.connected) return "OFFLINE";
  if (d.activeAlarms > 0) return "ALARM";
  return "ONLINE";
}

export type DeviceStatusCount = Record<DeviceStatus, number>;

export function countDeviceStatus(devices: readonly DeviceRecord[]): DeviceStatusCount {
  const count: DeviceStatusCount = { ONLINE: 0, ALARM: 0, OFFLINE: 0 };
  for (const d of devices) count[deviceStatus(d)] += 1;
  return count;
}

export function warrantyStatus(expiresAt: string, today: string): "IN_WARRANTY" | "EXPIRED" {
  return expiresAt >= today ? "IN_WARRANTY" : "EXPIRED";
}
