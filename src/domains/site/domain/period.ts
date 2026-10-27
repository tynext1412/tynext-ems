import type { Granularity, Period } from "@/domains/performance/domain/performance";
import { addDays, formatDateKey } from "@/shared/domain/time";

// Navigasi periode (Day/Month/Year/Lifetime) dan rentang zoom sumbu waktu harian. Murni, diuji.

function keyLength(granularity: Granularity): number {
  return granularity === "day" ? 10 : granularity === "month" ? 7 : 4;
}

export function stepPeriod(period: Period, delta: number): Period {
  const { granularity, date } = period;
  if (granularity === "day") return { granularity, date: addDays(date, delta) };
  const [y, m] = date.split("-").map(Number);
  if (granularity === "month") {
    const total = y * 12 + (m - 1) + delta;
    return { granularity, date: `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01` };
  }
  return { granularity, date: `${y + delta}-01-01` };
}

export function periodLabel({ granularity, date }: Period): string {
  if (granularity === "day") return formatDateKey(date);
  if (granularity === "month") return `${date.slice(5, 7)}/${date.slice(0, 4)}`;
  if (granularity === "year") return date.slice(0, 4);
  return "Lifetime";
}

export function canStepForward(period: Period, today: string): boolean {
  if (period.granularity === "lifetime") return false;
  const len = keyLength(period.granularity);
  return stepPeriod(period, 1).date.slice(0, len) <= today.slice(0, len);
}

export function canStepBack(period: Period, minDate: string): boolean {
  if (period.granularity === "lifetime") return false;
  const len = keyLength(period.granularity);
  return period.date.slice(0, len) > minDate.slice(0, len);
}

// ── Zoom sumbu waktu (menit sejak tengah malam, 0–1440) ──────────────────────

export type TimeWindow = readonly [number, number];

export const FULL_DAY: TimeWindow = [0, 1440];
const MIN_SPAN = 30; // menit; data per 5 menit → minimal 6 sampel terlihat

export function isFullDay(w: TimeWindow): boolean {
  return w[0] <= 0 && w[1] >= 1440;
}

export function clampWindow(from: number, to: number): TimeWindow {
  let a = Math.max(0, Math.min(from, to));
  let b = Math.min(1440, Math.max(from, to));
  if (b - a < MIN_SPAN) {
    const mid = (a + b) / 2;
    a = Math.max(0, mid - MIN_SPAN / 2);
    b = Math.min(1440, a + MIN_SPAN);
    a = b - MIN_SPAN;
  }
  return [Math.round(a), Math.round(b)];
}

export function zoomIn(w: TimeWindow): TimeWindow {
  const span = w[1] - w[0];
  const mid = (w[0] + w[1]) / 2;
  return clampWindow(mid - span / 4, mid + span / 4);
}

export function zoomOut(w: TimeWindow): TimeWindow {
  const span = w[1] - w[0];
  const mid = (w[0] + w[1]) / 2;
  const next = clampWindow(mid - span, mid + span);
  return isFullDay(next) ? FULL_DAY : next;
}

// Zoom di sekitar satu titik waktu (posisi kursor): jarak kiri/kanan ke anchor dikali factor
// (< 1 memperbesar, > 1 memperkecil). Kembali ke hari penuh bila sudah mencakup 00:00–24:00.
export function zoomAround(w: TimeWindow, anchor: number, factor: number): TimeWindow {
  const a = Math.max(w[0], Math.min(w[1], anchor));
  const next = clampWindow(a - (a - w[0]) * factor, a + (w[1] - a) * factor);
  return isFullDay(next) ? FULL_DAY : next;
}

// Tick yang rapi untuk rentang yang terlihat: 3 jam penuh → 1 jam → 30 → 15 → 5 menit.
export function zoomTicks([from, to]: TimeWindow): number[] {
  const span = to - from;
  const step = span > 720 ? 180 : span > 360 ? 60 : span > 120 ? 30 : span > 60 ? 15 : 5;
  const ticks: number[] = [];
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) ticks.push(t);
  return ticks;
}
