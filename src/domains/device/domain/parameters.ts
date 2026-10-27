import type { DeviceKind } from "./device";

// Katalog parameter chart per tipe perangkat. `kind` menentukan periode yang
// bisa dipakai: "instant" = deret 5 menit (Day); "energy" = batang per hari/bulan
// (Month/Year/Lifetime).
export type ParameterKind = "instant" | "energy";

export interface ParameterDef {
  key: string;
  label: string;
  unit: string;
  group: string;
  kind: ParameterKind;
  fractionDigits: number;
}

const inverter: ParameterDef[] = [
  { key: "powerKW", label: "Power", unit: "kW", group: "Inverter", kind: "instant", fractionDigits: 1 },
  { key: "dailyYieldKWh", label: "Daily Yield", unit: "kWh", group: "Inverter", kind: "energy", fractionDigits: 0 },
  { key: "internalTempC", label: "Internal Temperature", unit: "°C", group: "Inverter", kind: "instant", fractionDigits: 1 },
  { key: "dcVoltageV", label: "DC Voltage", unit: "V", group: "DC", kind: "instant", fractionDigits: 1 },
  { key: "dcCurrentA", label: "DC Current", unit: "A", group: "DC", kind: "instant", fractionDigits: 1 },
  { key: "acVoltageL1V", label: "AC Voltage L1", unit: "V", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acVoltageL2V", label: "AC Voltage L2", unit: "V", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acVoltageL3V", label: "AC Voltage L3", unit: "V", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acCurrentL1A", label: "AC Current L1", unit: "A", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acCurrentL2A", label: "AC Current L2", unit: "A", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acCurrentL3A", label: "AC Current L3", unit: "A", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "frequencyHz", label: "Frequency", unit: "Hz", group: "AC", kind: "instant", fractionDigits: 2 },
];

const battery: ParameterDef[] = [
  { key: "socPercent", label: "Battery SOC", unit: "%", group: "Battery", kind: "instant", fractionDigits: 0 },
  { key: "powerKW", label: "BMS Battery Power", unit: "kW", group: "Battery", kind: "instant", fractionDigits: 1 },
  { key: "voltageV", label: "BMS Battery Voltage", unit: "V", group: "Battery", kind: "instant", fractionDigits: 1 },
  { key: "currentA", label: "BMS Battery Current", unit: "A", group: "Battery", kind: "instant", fractionDigits: 1 },
  { key: "dailyChargeKWh", label: "Daily Charge", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
  { key: "dailyDischargeKWh", label: "Daily Discharge", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
];

const pcs: ParameterDef[] = [
  { key: "powerKW", label: "AC Power", unit: "kW", group: "PCS", kind: "instant", fractionDigits: 1 },
  { key: "internalTempC", label: "Internal Temperature", unit: "°C", group: "PCS", kind: "instant", fractionDigits: 1 },
  { key: "dcVoltageV", label: "DC Bus Voltage", unit: "V", group: "DC", kind: "instant", fractionDigits: 1 },
  { key: "dcCurrentA", label: "DC Current", unit: "A", group: "DC", kind: "instant", fractionDigits: 1 },
  { key: "acVoltageL1V", label: "AC Voltage L1", unit: "V", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acVoltageL2V", label: "AC Voltage L2", unit: "V", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acVoltageL3V", label: "AC Voltage L3", unit: "V", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acCurrentL1A", label: "AC Current L1", unit: "A", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acCurrentL2A", label: "AC Current L2", unit: "A", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "acCurrentL3A", label: "AC Current L3", unit: "A", group: "AC", kind: "instant", fractionDigits: 1 },
  { key: "frequencyHz", label: "Frequency", unit: "Hz", group: "AC", kind: "instant", fractionDigits: 2 },
  { key: "dailyChargeKWh", label: "Daily Charge", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
  { key: "dailyDischargeKWh", label: "Daily Discharge", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
];

const meter: ParameterDef[] = [
  { key: "activePowerKW", label: "Active Power", unit: "kW", group: "Power", kind: "instant", fractionDigits: 1 },
  { key: "voltageV", label: "Voltage", unit: "V", group: "Voltage", kind: "instant", fractionDigits: 1 },
  { key: "currentA", label: "Current", unit: "A", group: "Current", kind: "instant", fractionDigits: 1 },
  { key: "frequencyHz", label: "Frequency", unit: "Hz", group: "Other", kind: "instant", fractionDigits: 2 },
  { key: "powerFactor", label: "Power Factor", unit: "", group: "Other", kind: "instant", fractionDigits: 2 },
  { key: "dailyImportKWh", label: "Daily Import", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
  { key: "dailyExportKWh", label: "Daily Export", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
];

export const DEVICE_PARAMETERS: Record<DeviceKind, readonly ParameterDef[]> = { INVERTER: inverter, BATTERY: battery, PCS: pcs, METER: meter };

// Parameter default yang dicentang saat chart dibuka.
export const DEFAULT_PARAMETERS: Record<DeviceKind, readonly string[]> = {
  INVERTER: ["powerKW", "dcVoltageV", "acCurrentL1A"],
  BATTERY: ["socPercent", "powerKW", "voltageV"],
  PCS: ["powerKW", "dcVoltageV", "acCurrentL1A"],
  METER: ["activePowerKW", "voltageV", "currentA"],
};

export function parameterByKey(kind: DeviceKind, key: string): ParameterDef | undefined {
  return DEVICE_PARAMETERS[kind].find((p) => p.key === key);
}

// Satu chart per satuan: parameter dengan satuan sama digambar bersama, satuan
// berbeda jadi chart terpisah (tidak ada sumbu ganda).
export function groupByUnit(params: readonly ParameterDef[]): { unit: string; params: ParameterDef[] }[] {
  const groups = new Map<string, ParameterDef[]>();
  for (const p of params) {
    const list = groups.get(p.unit) ?? [];
    list.push(p);
    groups.set(p.unit, list);
  }
  return [...groups.entries()].map(([unit, list]) => ({ unit, params: list }));
}
