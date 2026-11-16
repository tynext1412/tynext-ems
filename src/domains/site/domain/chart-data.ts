import type { EnergyBucket, TariffPoint } from "@/domains/performance/domain/performance";
import type { PowerSample } from "@/domains/telemetry/domain/power-snapshot";
import { localHour } from "@/shared/domain/time";

// Pemetaan read model → titik chart. Murni, tanpa React/recharts, supaya bisa diuji.

export interface DailyPowerPoint {
  t: number; // menit sejak tengah malam lokal plant
  grid: number;
  pv: number;
  battery: number; // + charge, − discharge
  genset: number;
  load: number;
  soc: number;
}

export function minutesOfDay(iso: string, timeZone: string): number {
  return Math.round(localHour(new Date(iso), timeZone) * 60);
}

export function dailyPowerPoints(samples: readonly PowerSample[], timeZone: string): DailyPowerPoint[] {
  return samples.map((s) => ({
    t: minutesOfDay(s.at, timeZone),
    grid: s.gridKW,
    pv: s.pvKW,
    battery: s.batteryKW,
    genset: s.gensetKW,
    load: s.loadKW,
    soc: s.socPercent,
  }));
}

export interface TariffChartPoint {
  t: number;
  purchase: number;
  feedIn: number;
}

export function tariffPoints(points: readonly TariffPoint[], timeZone: string): TariffChartPoint[] {
  return points.map((p, i) => ({
    // Titik terakhir (jam 24) jatuh ke menit 0 hari berikutnya; paksa ke 1440 supaya garis menutup hari.
    t: i === points.length - 1 && minutesOfDay(p.at, timeZone) === 0 ? 1440 : minutesOfDay(p.at, timeZone),
    purchase: p.purchaseIDRPerKWh,
    feedIn: p.feedInIDRPerKWh,
  }));
}

export interface SocTariffPoint {
  t: number;
  soc?: number; // kosong di menit yang hanya punya titik tarif
  purchase?: number;
  feedIn?: number;
}

// Satu deret untuk grafik gabungan SOC + tarif: gabungan menit SOC (1 menit hari ini, 5 menit hari lain) dan menit tarif
// (per jam). Tarif berlaku sampai titik tarif berikutnya, jadi tiap baris memakai tarif terakhir
// yang sudah berlaku; menit sebelum titik tarif pertama dibiarkan kosong.
export function socTariffPoints(daily: readonly DailyPowerPoint[], tariff: readonly TariffChartPoint[]): SocTariffPoint[] {
  const rows = new Map<number, SocTariffPoint>();
  for (const p of daily) rows.set(p.t, { t: p.t, soc: p.soc });
  for (const p of tariff) if (!rows.has(p.t)) rows.set(p.t, { t: p.t });
  const sorted = [...rows.values()].sort((a, b) => a.t - b.t);
  const steps = [...tariff].sort((a, b) => a.t - b.t);
  let j = -1;
  for (const row of sorted) {
    while (j + 1 < steps.length && steps[j + 1].t <= row.t) j++;
    if (j >= 0) {
      row.purchase = steps[j].purchase;
      row.feedIn = steps[j].feedIn;
    }
  }
  return sorted;
}

// Satu kelompok batang chart energi: tiap aliran punya batangnya sendiri (tidak ditumpuk).
export interface EnergyBarPoint {
  key: string;
  label: string;
  pv: number;
  import: number;
  export: number;
  charge: number;
  discharge: number;
  consumption: number;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function bucketLabel(key: string): string {
  if (key.length === 10) return String(Number(key.slice(8, 10))); // hari dalam bulan
  if (key.length === 7) return MONTH_SHORT[Number(key.slice(5, 7)) - 1] ?? key;
  return key;
}

export function energyBarPoints(buckets: readonly EnergyBucket[]): EnergyBarPoint[] {
  return buckets.map((b) => ({
    key: b.key,
    label: bucketLabel(b.key),
    pv: b.pvProductionKWh,
    import: b.gridSupplyKWh,
    export: b.gridExportKWh,
    charge: b.chargeKWh,
    discharge: b.dischargeKWh,
    consumption: b.loadKWh,
  }));
}

export function formatMinutes(t: number): string {
  if (t >= 1440) return "24:00"; // batas akhir hari pada sumbu/rentang zoom
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
