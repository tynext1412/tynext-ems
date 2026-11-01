import type { DeviceType } from "@/domains/plant/domain/plant";
import { isActive, type Alarm, type AlarmSeverity } from "./alarm";

// Label tingkat alarm di tabel (desain): CRITICAL → Fault, WARNING → Warning, INFO → Info.
export const ALARM_LEVEL_LABEL: Record<AlarmSeverity, string> = {
  CRITICAL: "Fault",
  WARNING: "Warning",
  INFO: "Info",
};

export const ALARM_SEVERITIES: readonly AlarmSeverity[] = ["CRITICAL", "WARNING", "INFO"];

export type AlarmDeviceType = DeviceType | "UNKNOWN";

export const ALARM_DEVICE_TYPES: readonly DeviceType[] = ["INVERTER", "BATTERY", "PCS", "METER", "LOGGER"];

export const ALARM_DEVICE_TYPE_LABEL: Record<AlarmDeviceType, string> = {
  INVERTER: "Inverter",
  BATTERY: "Battery",
  PCS: "PCS",
  METER: "Meter",
  LOGGER: "Data Logger",
  UNKNOWN: "Device",
};

const SEGMENT_TO_TYPE: Record<string, DeviceType> = { INV: "INVERTER", BAT: "BATTERY", PCS: "PCS", MTR: "METER", LOG: "LOGGER" };

// Jenis perangkat dari id device ("PLT-003-INV-01" → INVERTER). Alarm hanya membawa id device.
export function deviceTypeFromId(deviceId: string): AlarmDeviceType {
  for (const segment of deviceId.toUpperCase().split("-")) {
    const type = SEGMENT_TO_TYPE[segment];
    if (type) return type;
  }
  return "UNKNOWN";
}

// Lama alarm berlangsung: sampai pulih, atau sampai sekarang bila masih aktif.
export function alarmDurationMs(alarm: Pick<Alarm, "raisedAt" | "clearedAt">, now: number): number {
  const end = alarm.clearedAt ? new Date(alarm.clearedAt).getTime() : now;
  return Math.max(0, end - new Date(alarm.raisedAt).getTime());
}

// "19 min", "1 h 12 min", "2 d 3 h".
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  const days = Math.floor(hours / 24);
  return `${days} d ${hours % 24} h`;
}

export interface AlarmFilter {
  search: string; // id device, serial number, atau isi alarm
  deviceType: AlarmDeviceType | "ALL";
  severity: AlarmSeverity | "ALL";
}

export const DEFAULT_ALARM_FILTER: AlarmFilter = { search: "", deviceType: "ALL", severity: "ALL" };

// Pencocokan satu alarm dengan filter halaman. serialNumber opsional (dari daftar device).
export function matchesAlarmFilter(alarm: Alarm, filter: AlarmFilter, serialNumber?: string): boolean {
  if (filter.deviceType !== "ALL" && deviceTypeFromId(alarm.deviceId) !== filter.deviceType) return false;
  if (filter.severity !== "ALL" && alarm.severity !== filter.severity) return false;
  const q = filter.search.trim().toLowerCase();
  if (!q) return true;
  return [alarm.deviceId, serialNumber ?? "", alarm.message, alarm.code].some((field) => field.toLowerCase().includes(q));
}

export function splitAlarms(alarms: readonly Alarm[]): { active: Alarm[]; recovered: Alarm[] } {
  return { active: alarms.filter(isActive), recovered: alarms.filter((a) => !isActive(a)) };
}

// "28 Oct 2026, 14:48" dalam zona waktu plant.
export function formatAlarmTime(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}
