import type { PlantId } from "@/domains/plant/domain/plant";

// Tipe perangkat yang disediakan di menu Device: inverter, baterai, PCS (power conversion system), meter.
export type DeviceKind = "INVERTER" | "BATTERY" | "PCS" | "METER";

export const DEVICE_KINDS: readonly DeviceKind[] = ["INVERTER", "BATTERY", "PCS", "METER"];

export const DEVICE_KIND_LABEL: Record<DeviceKind, string> = {
  INVERTER: "Inverter",
  BATTERY: "Battery",
  PCS: "PCS",
  METER: "Meter",
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
  originalSerialNumber?: string; // SN dari pabrikan bila berbeda dari SN platform
}

export type DeviceRecord = InverterRecord | BatteryRecord | PcsRecord | MeterRecord;

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
