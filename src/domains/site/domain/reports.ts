import { deviceStatus, DEVICE_STATUS_LABEL, deviceTypeLabel, type DeviceRecord } from "@/domains/device/domain/device";
import type { ParameterDef } from "@/domains/device/domain/parameters";
import type { OperatingData, Period } from "@/domains/performance/domain/performance";
import { timezoneAbbrev, toDateKey } from "@/shared/domain/time";
import { safeFilename, type CellValue, type SheetSpec } from "@/shared/lib/xlsx";
import { formatMinutes, type DailyPowerPoint, type EnergyBarPoint, type SocTariffPoint } from "./chart-data";

// Isi berkas "Download report": satu sheet per blok data yang tampil. Overview: Operating Data
// + grafik Day (Daily Power, Battery SOC & Tariff) atau grafik energi (Month/Year/Lifetime).
// Perangkat: identitas perangkat + satu sheet per chart (satu satuan per chart).
// Angka ditulis apa adanya (tidak diskalakan ke MWh/jt) supaya bisa dihitung di Excel.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GRANULARITY_NAME = { day: "Day", month: "Month", year: "Year", lifetime: "Lifetime" } as const;

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

function dayLabel(key: string): string {
  return `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
}

// "Day · 2 Nov 2026", "Month · Nov 2026", "Year · 2026", "Lifetime · since 1 Sep 2024".
export function reportPeriodLabel(period: Period, since?: string): string {
  const { granularity, date } = period;
  if (granularity === "day") return `Day · ${dayLabel(date)}`;
  if (granularity === "month") return `Month · ${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
  if (granularity === "year") return `Year · ${date.slice(0, 4)}`;
  return since ? `Lifetime · since ${dayLabel(since)}` : "Lifetime";
}

// "2026-11-02 08:15 WIB" dalam zona waktu plant.
export function generatedLabel(at: Date, timeZone: string): string {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  return `${toDateKey(at, timeZone)} ${time} ${timezoneAbbrev(timeZone)}`;
}

function periodKey(period: Period): string {
  if (period.granularity === "day") return period.date;
  if (period.granularity === "month") return period.date.slice(0, 7);
  if (period.granularity === "year") return period.date.slice(0, 4);
  return ""; // Lifetime: nama granularitas sudah cukup
}

// "Tynext-Report_PLT-003_Day_2026-11-02.xlsx", "Tynext-Report_PLT-003_Lifetime.xlsx"
export function reportFilename(subject: string, period: Period): string {
  return `${safeFilename("Tynext-Report", subject, GRANULARITY_NAME[period.granularity], periodKey(period))}.xlsx`;
}

interface ReportPlant {
  id: string;
  name: string;
  timezone: string;
  commissionedAt: string;
  hasBattery: boolean;
}

export interface OverviewReportInput {
  plant: ReportPlant;
  period: Period;
  generatedAt: Date;
  operating: OperatingData;
  daily?: readonly DailyPowerPoint[]; // Day
  socTariff?: readonly SocTariffPoint[]; // Day
  energy?: readonly EnergyBarPoint[]; // Month/Year/Lifetime
}

const ENERGY_TITLE = { month: "Energy per day", year: "Energy per month", lifetime: "Energy per year" } as const;
const ENERGY_BUCKET = { month: "Date", year: "Month", lifetime: "Year" } as const;

export function buildOverviewReport(input: OverviewReportInput): SheetSpec[] {
  const { plant, period, operating: o } = input;
  const tz = timezoneAbbrev(plant.timezone);
  const meta: [string, CellValue][] = [
    ["Plant", plant.name],
    ["Plant ID", plant.id],
    ["Period", reportPeriodLabel(period, plant.commissionedAt)],
    ["Time zone", `${plant.timezone} (${tz})`],
    ["Generated", generatedLabel(input.generatedAt, plant.timezone)],
  ];

  const sheets: SheetSpec[] = [
    {
      name: "Operating Data",
      meta,
      columns: ["Parameter", "Value", "Unit"],
      rows: [
        ["PV Production", round(o.pvProductionKWh, 2), "kWh"],
        ["BESS Charge", round(o.bessChargeKWh, 2), "kWh"],
        ["BESS Discharge", round(o.bessDischargeKWh, 2), "kWh"],
        ["Diesel Generator", o.dieselGeneratorKWh > 0 ? round(o.dieselGeneratorKWh, 2) : "Not Installed", o.dieselGeneratorKWh > 0 ? "kWh" : null],
        ["Load Consumption", round(o.loadConsumptionKWh, 2), "kWh"],
        ["Daily Operation", o.dayOperation, "day"],
        ["Hours Operation", round(o.hoursOperation, 1), "h"],
        ["Revenue", round(o.revenueIDR, 2), "IDR"],
      ],
    },
  ];

  if (period.granularity === "day") {
    sheets.push({
      name: "Daily Power",
      meta: [...meta, ["Sign convention", "Battery: + charge, − discharge. Grid: + import, − export."]],
      columns: [`Time (${tz})`, "Grid (kW)", "PV (kW)", "Battery (kW)", "Generator (kW)", "Load (kW)"],
      rows: (input.daily ?? []).map((p) => [formatMinutes(p.t), round(p.grid, 1), round(p.pv, 1), round(p.battery, 1), round(p.genset, 1), round(p.load, 1)]),
    });
    sheets.push({
      name: plant.hasBattery ? "Battery SOC & Tariff" : "Tariff",
      meta,
      columns: [`Time (${tz})`, ...(plant.hasBattery ? ["SOC (%)"] : []), "Purchase Tariff (Rp/kWh)", "Feed-in Tariff (Rp/kWh)"],
      rows: (input.socTariff ?? []).map((p) => [formatMinutes(p.t), ...(plant.hasBattery ? [p.soc] : []), p.purchase === undefined ? null : round(p.purchase, 2), p.feedIn === undefined ? null : round(p.feedIn, 2)]),
    });
  } else {
    const g = period.granularity;
    sheets.push({
      name: ENERGY_TITLE[g],
      meta,
      columns: [ENERGY_BUCKET[g], "PV (kWh)", "Import (kWh)", "Export (kWh)", ...(plant.hasBattery ? ["Charge (kWh)", "Discharge (kWh)"] : []), "Consumption (kWh)"],
      rows: (input.energy ?? []).map((b) => [b.key, round(b.pv, 2), round(b.import, 2), round(b.export, 2), ...(plant.hasBattery ? [round(b.charge, 2), round(b.discharge, 2)] : []), round(b.consumption, 2)]),
    });
  }
  return sheets;
}

export interface DeviceReportInput {
  device: DeviceRecord;
  plant: { id: string; name: string; timezone: string };
  period: Period;
  generatedAt: Date;
  groups: readonly { unit: string; params: readonly ParameterDef[] }[]; // chart yang tampil
  daily?: readonly (Record<string, number> & { t: number })[]; // Day
  energy?: readonly (Record<string, number | string> & { key: string })[]; // Month/Year/Lifetime
}

const header = (p: ParameterDef) => (p.unit ? `${p.label} (${p.unit})` : p.label);

export function buildDeviceReport(input: DeviceReportInput): SheetSpec[] {
  const { device: d, plant, period } = input;
  const tz = timezoneAbbrev(plant.timezone);
  const meta: [string, CellValue][] = [
    ["Device", d.name],
    ["Serial Number", d.serialNumber],
    ["Plant", `${plant.name} (${plant.id})`],
    ["Period", reportPeriodLabel(period, d.commissionedAt)],
    ["Generated", generatedLabel(input.generatedAt, plant.timezone)],
  ];

  const sheets: SheetSpec[] = [
    {
      name: "Device",
      meta,
      columns: ["Field", "Value"],
      rows: [
        ["Device Name", d.name],
        ["Device Type", deviceTypeLabel(d)],
        ["Serial Number", d.serialNumber],
        ["Model", d.model],
        ["Vendor", d.vendor],
        ["Status", DEVICE_STATUS_LABEL[deviceStatus(d)]],
        ["Active Alarms", d.activeAlarms],
        ["Plant", plant.name],
        ["Plant ID", plant.id],
        ["Datalogger", d.dataloggerId],
        ["Communication Address", d.address],
        ["Firmware Version", d.firmwareVersion],
        ["Commissioning Date", dayLabel(d.commissionedAt)],
      ],
    },
  ];

  const isDay = period.granularity === "day";
  for (const { unit, params } of input.groups) {
    const name = unit ? `Chart ${unit}` : "Chart (no unit)";
    if (isDay) {
      sheets.push({
        name,
        meta,
        columns: [`Time (${tz})`, ...params.map(header)],
        rows: (input.daily ?? []).map((pt) => [formatMinutes(pt.t), ...params.map((p) => (pt[p.key] === undefined ? null : round(pt[p.key], p.fractionDigits)))]),
      });
    } else {
      sheets.push({
        name,
        meta,
        columns: ["Period", ...params.map(header)],
        rows: (input.energy ?? []).map((pt) => [pt.key, ...params.map((p) => (typeof pt[p.key] === "number" ? round(pt[p.key] as number, p.fractionDigits) : null))]),
      });
    }
  }
  return sheets;
}
