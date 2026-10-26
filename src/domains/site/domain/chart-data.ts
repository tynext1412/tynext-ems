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

export interface EnergyBarPoint {
  key: string;
  label: string;
  grid: number;
  pv: number;
  discharge: number;
  genset: number;
  charge: number; // digambar negatif (energi masuk ke baterai)
  load: number;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function bucketLabel(key: string): string {
  if (key.length === 10) return String(Number(key.slice(8, 10))); // hari dalam bulan
  if (key.length === 7) return MONTH_SHORT[Number(key.slice(5, 7)) - 1] ?? key;
  return key;
}

export function energyBarPoints(buckets: readonly EnergyBucket[]): EnergyBarPoint[] {
  return buckets.map((b) => ({
    key: b.key,
    label: bucketLabel(b.key),
    grid: b.gridSupplyKWh,
    pv: b.pvProductionKWh,
    discharge: b.dischargeKWh,
    genset: b.generatorSupplyKWh,
    charge: -b.chargeKWh,
    load: b.loadKWh,
  }));
}

export function formatMinutes(t: number): string {
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
