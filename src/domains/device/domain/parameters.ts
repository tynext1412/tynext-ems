import type { DeviceRecord } from "./device";

// Katalog parameter chart per jenis perangkat, mengikuti sheet "Device RealTime" di EMS Parameter
// List (kecuali PCS yang belum ada di sheet). `kind` menentukan periode yang bisa dipakai:
// "instant" = deret 5 menit (Day); "energy" = batang per hari/bulan/tahun (Month/Year/Lifetime).
// Parameter enum (Run State, status), nilai statis, dan penghitung kumulatif hanya tampil di
// panel real-time, tidak di chart.
export type ParameterKind = "instant" | "energy";

export interface ParameterDef {
  key: string;
  label: string;
  unit: string;
  group: string;
  kind: ParameterKind;
  fractionDigits: number;
}

// String Inverter, mengikuti sheet "Device RealTime" di EMS Parameter List. Parameter enum (Inverter
// Status, Run State, Grid Connection Status), nilai statis (Rated Power), dan penghitung kumulatif
// (Total Yield, Total DC Input Energy) hanya tampil di Real-time Information, tidak di chart.
const inverter: ParameterDef[] = [
  { key: "activePowerKW", label: "Active Power", unit: "kW", group: "Power", kind: "instant", fractionDigits: 1 },
  { key: "reactivePowerKvar", label: "Reactive Power", unit: "kvar", group: "Power", kind: "instant", fractionDigits: 1 },
  { key: "apparentPowerKVA", label: "Apparent Power", unit: "kVA", group: "Power", kind: "instant", fractionDigits: 1 },
  { key: "powerFactor", label: "Power Factor", unit: "", group: "Power", kind: "instant", fractionDigits: 3 },
  { key: "lineVoltageABV", label: "Grid Line Voltage AB", unit: "V", group: "Line Voltage", kind: "instant", fractionDigits: 1 },
  { key: "lineVoltageBCV", label: "Grid Line Voltage BC", unit: "V", group: "Line Voltage", kind: "instant", fractionDigits: 1 },
  { key: "lineVoltageCAV", label: "Grid Line Voltage CA", unit: "V", group: "Line Voltage", kind: "instant", fractionDigits: 1 },
  { key: "phaseAVoltageV", label: "Phase A Voltage", unit: "V", group: "Phase", kind: "instant", fractionDigits: 1 },
  { key: "phaseBVoltageV", label: "Phase B Voltage", unit: "V", group: "Phase", kind: "instant", fractionDigits: 1 },
  { key: "phaseCVoltageV", label: "Phase C Voltage", unit: "V", group: "Phase", kind: "instant", fractionDigits: 1 },
  { key: "phaseACurrentA", label: "Phase A Current", unit: "A", group: "Phase", kind: "instant", fractionDigits: 1 },
  { key: "phaseBCurrentA", label: "Phase B Current", unit: "A", group: "Phase", kind: "instant", fractionDigits: 1 },
  { key: "phaseCCurrentA", label: "Phase C Current", unit: "A", group: "Phase", kind: "instant", fractionDigits: 1 },
  { key: "gridFrequencyHz", label: "Grid Frequency", unit: "Hz", group: "Grid", kind: "instant", fractionDigits: 2 },
  { key: "yieldTodayKWh", label: "Yield Today", unit: "kWh", group: "Energy", kind: "energy", fractionDigits: 0 },
];

const p = (key: string, label: string, unit: string, group: string, fractionDigits = 1, kind: ParameterKind = "instant"): ParameterDef => ({ key, label, unit, group, kind, fractionDigits });

// C&I ESS (perangkat Battery). Data per rak tampil di tabel real-time.
const battery: ParameterDef[] = [
  p("chargeDischargePowerKW", "Charge/Discharge Power", "kW", "Power"),
  p("pcsActivePowerKW", "PCS Active Power", "kW", "Power"),
  p("pcsReactivePowerKvar", "PCS Reactive Power", "kvar", "Power"),
  p("socPercent", "SOC", "%", "State", 0),
  p("sohPercent", "SOH", "%", "State", 1),
  p("chargeableEnergyKWh", "Chargeable Energy", "kWh", "Available Energy", 0),
  p("dischargeableEnergyKWh", "Dischargeable Energy", "kWh", "Available Energy", 0),
  p("maxCellVoltageV", "Max Cell Voltage", "V", "Cell", 3),
  p("minCellVoltageV", "Min Cell Voltage", "V", "Cell", 3),
  p("maxCellTempC", "Max Cell Temperature", "°C", "Cell"),
  p("minCellTempC", "Min Cell Temperature", "°C", "Cell"),
  p("chargeEnergyKWh", "Charge Energy", "kWh", "Energy", 0, "energy"),
  p("dischargeEnergyKWh", "Discharge Energy", "kWh", "Energy", 0, "energy"),
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

// Grid Meter: dipakai STG, DEG, ESS, PV, dan Load meter.
const gridMeter: ParameterDef[] = [
  p("activePowerKW", "Active Power", "kW", "Power"),
  p("activePowerAKW", "Active Power Phase A", "kW", "Power"),
  p("activePowerBKW", "Active Power Phase B", "kW", "Power"),
  p("activePowerCKW", "Active Power Phase C", "kW", "Power"),
  p("reactivePowerKvar", "Reactive Power", "kvar", "Power"),
  p("reactivePowerAKvar", "Reactive Power Phase A", "kvar", "Power"),
  p("reactivePowerBKvar", "Reactive Power Phase B", "kvar", "Power"),
  p("reactivePowerCKvar", "Reactive Power Phase C", "kvar", "Power"),
  p("apparentPowerKVA", "Total Apparent Power", "kVA", "Power"),
  p("powerFactor", "Power Factor", "", "Power", 3),
  p("lineVoltageABV", "Line Voltage AB", "V", "Voltage"),
  p("lineVoltageBCV", "Line Voltage BC", "V", "Voltage"),
  p("lineVoltageCAV", "Line Voltage CA", "V", "Voltage"),
  p("phaseAVoltageV", "Phase A Voltage", "V", "Voltage"),
  p("phaseBVoltageV", "Phase B Voltage", "V", "Voltage"),
  p("phaseCVoltageV", "Phase C Voltage", "V", "Voltage"),
  p("phaseACurrentA", "Phase A Current", "A", "Current"),
  p("phaseBCurrentA", "Phase B Current", "A", "Current"),
  p("phaseCCurrentA", "Phase C Current", "A", "Current"),
  p("gridFrequencyHz", "Grid Frequency", "Hz", "Grid", 2),
  p("forwardActiveEnergyKWh", "Active Energy (Forward)", "kWh", "Energy", 0, "energy"),
  p("reverseActiveEnergyKWh", "Reverse Active Energy", "kWh", "Energy", 0, "energy"),
  p("forwardReactiveEnergyKvarh", "Forward Reactive Energy", "kvarh", "Energy", 0, "energy"),
  p("reverseReactiveEnergyKvarh", "Reverse Reactive Energy", "kvarh", "Energy", 0, "energy"),
];

// Power Sensor: tanpa daya reaktif per fasa dan daya semu; nama mengikuti sheet.
const powerSensor: ParameterDef[] = [
  p("activePowerKW", "Active Power", "kW", "Power"),
  p("activePowerAKW", "Active Power Phase A", "kW", "Power"),
  p("activePowerBKW", "Active Power Phase B", "kW", "Power"),
  p("activePowerCKW", "Active Power Phase C", "kW", "Power"),
  p("reactivePowerKvar", "Reactive Power", "kvar", "Power"),
  p("powerFactor", "Power Factor", "", "Power", 3),
  p("lineVoltageABV", "Line Voltage AB", "V", "Voltage"),
  p("lineVoltageBCV", "Line Voltage BC", "V", "Voltage"),
  p("lineVoltageCAV", "Line Voltage CA", "V", "Voltage"),
  p("phaseAVoltageV", "Grid Voltage (Phase A)", "V", "Voltage"),
  p("phaseBVoltageV", "Phase B Voltage", "V", "Voltage"),
  p("phaseCVoltageV", "Phase C Voltage", "V", "Voltage"),
  p("phaseACurrentA", "Grid Current (Phase A)", "A", "Current"),
  p("phaseBCurrentA", "Phase B Current", "A", "Current"),
  p("phaseCCurrentA", "Phase C Current", "A", "Current"),
  p("gridFrequencyHz", "Grid Frequency", "Hz", "Grid", 2),
  p("forwardActiveEnergyKWh", "Positive Active Energy", "kWh", "Energy", 0, "energy"),
  p("reverseActiveEnergyKWh", "Reverse Active Energy", "kWh", "Energy", 0, "energy"),
  p("forwardReactiveEnergyKvarh", "Forward Reactive Energy", "kvarh", "Energy", 0, "energy"),
  p("reverseReactiveEnergyKvarh", "Reverse Reactive Energy", "kvarh", "Energy", 0, "energy"),
];

// EMI / Weather Station.
const emi: ParameterDef[] = [
  p("irradiancePoaWm2", "Irradiance (POA)", "W/m²", "Irradiance", 0),
  p("horizontalIrradianceWm2", "Horizontal Irradiance", "W/m²", "Irradiance", 0),
  p("ambientTempC", "Ambient Temperature", "°C", "Temperature"),
  p("moduleTempC", "PV Module Temperature", "°C", "Temperature"),
  p("windSpeedMs", "Wind Speed", "m/s", "Wind"),
  p("windDirectionDeg", "Wind Direction", "°", "Wind", 0),
  p("dailyIrradiationPoaKWhM2", "Daily Irradiation (POA)", "kWh/m²", "Irradiation", 2, "energy"),
  p("dailyHorizontalIrradiationKWhM2", "Daily Horizontal Irradiation", "kWh/m²", "Irradiation", 2, "energy"),
];

export type ParameterCatalogId = "INVERTER" | "BATTERY" | "PCS" | "GRID_METER" | "POWER_SENSOR" | "EMI";

export const PARAMETER_CATALOGS: Record<ParameterCatalogId, readonly ParameterDef[]> = {
  INVERTER: inverter,
  BATTERY: battery,
  PCS: pcs,
  GRID_METER: gridMeter,
  POWER_SENSOR: powerSensor,
  EMI: emi,
};

// Parameter yang dicentang saat chart dibuka.
export const DEFAULT_PARAMETERS: Record<ParameterCatalogId, readonly string[]> = {
  INVERTER: ["activePowerKW", "phaseAVoltageV", "phaseACurrentA"],
  BATTERY: ["chargeDischargePowerKW", "socPercent", "maxCellTempC"],
  PCS: ["powerKW", "dcVoltageV", "acCurrentL1A"],
  GRID_METER: ["activePowerKW", "phaseAVoltageV", "phaseACurrentA"],
  POWER_SENSOR: ["activePowerKW", "phaseAVoltageV", "phaseACurrentA"],
  EMI: ["irradiancePoaWm2", "horizontalIrradianceWm2", "moduleTempC"],
};

export function catalogIdFor(device: Pick<DeviceRecord, "kind"> & { meterType?: string }): ParameterCatalogId {
  if (device.kind === "METER") return device.meterType === "POWER_SENSOR" ? "POWER_SENSOR" : "GRID_METER";
  return device.kind;
}

export function parametersFor(device: Pick<DeviceRecord, "kind"> & { meterType?: string }): readonly ParameterDef[] {
  return PARAMETER_CATALOGS[catalogIdFor(device)];
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
