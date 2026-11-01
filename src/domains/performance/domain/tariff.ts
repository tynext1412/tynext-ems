import type { IDR } from "@/shared/domain/units";

// Tarif beli listrik (dari grid) per plant. Dua mode:
//   FLAT        satu tarif untuk 24 jam
//   TIME_OF_USE tarif dasar + periode jam dengan tarif sendiri (mis. WBP 17:00–22:00)
// Jam memakai waktu lokal plant, granularitas 1 jam. Periode [startHour, endHour) boleh melewati
// tengah malam (22:00–06:00 → endHour < startHour).

export type TariffMode = "FLAT" | "TIME_OF_USE";

export const TARIFF_MODE_LABEL: Record<TariffMode, string> = {
  FLAT: "Flat 24 hours",
  TIME_OF_USE: "Time of use",
};

export interface TariffBand {
  startHour: number; // 0–23
  endHour: number; // 1–24
  rateIDRPerKWh: IDR;
}

export interface PurchaseTariff {
  mode: TariffMode;
  baseRateIDRPerKWh: IDR; // FLAT: tarif 24 jam; TIME_OF_USE: tarif di luar semua periode
  bands: TariffBand[]; // diabaikan bila FLAT
}

export const MAX_RATE_IDR = 100_000;
export const MAX_BANDS = 6;

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

// Jam-jam (0–23) yang dicakup satu periode, mengikuti arah jam termasuk lewat tengah malam.
export function bandHours({ startHour, endHour }: TariffBand): number[] {
  const end = endHour % 24;
  if (startHour === end) return [];
  const hours: number[] = [];
  for (let h = startHour; h !== end; h = (h + 1) % 24) hours.push(h);
  return hours;
}

// Indeks periode yang berlaku di tiap jam (null = tarif dasar). Bila tumpang tindih, periode
// pertama menang; validasi mencegah kondisi itu tersimpan.
export function bandIndexByHour(tariff: PurchaseTariff): (number | null)[] {
  const index: (number | null)[] = Array.from({ length: 24 }, () => null);
  if (tariff.mode === "FLAT") return index;
  tariff.bands.forEach((band, i) => {
    for (const h of bandHours(band)) if (index[h] === null) index[h] = i;
  });
  return index;
}

export function rateAt(tariff: PurchaseTariff, hour: number): IDR {
  const i = bandIndexByHour(tariff)[((hour % 24) + 24) % 24];
  return i === null ? tariff.baseRateIDRPerKWh : tariff.bands[i].rateIDRPerKWh;
}

export interface TariffSegment {
  startHour: number;
  endHour: number;
  rateIDRPerKWh: IDR;
  band: number | null; // indeks periode; null = tarif dasar
}

// Ruas berurutan 00:00–24:00 dengan tarif yang sama, untuk bar 24 jam dan ringkasan.
export function tariffSegments(tariff: PurchaseTariff): TariffSegment[] {
  const index = bandIndexByHour(tariff);
  const segments: TariffSegment[] = [];
  for (let h = 0; h < 24; h++) {
    const last = segments.at(-1);
    if (last && last.band === index[h]) last.endHour = h + 1;
    else segments.push({ startHour: h, endHour: h + 1, band: index[h], rateIDRPerKWh: rateAt(tariff, h) });
  }
  return segments;
}

export interface TariffErrors {
  base?: string;
  bands?: (string | undefined)[]; // pesan per periode, sejajar dengan tariff.bands
  form?: string;
}

function rateError(rate: number): string | undefined {
  if (!Number.isFinite(rate) || rate <= 0) return "Enter a rate above Rp 0";
  if (rate > MAX_RATE_IDR) return `Rate must be at most Rp ${MAX_RATE_IDR.toLocaleString("id-ID")}`;
  return undefined;
}

export function validateTariff(tariff: PurchaseTariff): TariffErrors {
  const errors: TariffErrors = {};
  const base = rateError(tariff.baseRateIDRPerKWh);
  if (base) errors.base = base;
  if (tariff.mode === "FLAT") return errors;

  if (tariff.bands.length === 0) errors.form = "Add at least one period, or choose Flat 24 hours";
  if (tariff.bands.length > MAX_BANDS) errors.form = `At most ${MAX_BANDS} periods`;

  const owner: (number | null)[] = Array.from({ length: 24 }, () => null);
  const bandErrors = tariff.bands.map((band, i) => {
    const hours = bandHours(band);
    if (hours.length === 0) return "Start and end must be different hours";
    const clash = hours.map((h) => owner[h]).find((o) => o !== null);
    for (const h of hours) if (owner[h] === null) owner[h] = i;
    if (clash !== undefined && clash !== null) return `Overlaps with period ${clash + 1}`;
    return rateError(band.rateIDRPerKWh);
  });
  if (bandErrors.some(Boolean)) errors.bands = bandErrors;
  if (!errors.form && owner.every((o) => o !== null)) errors.form = "Periods cover all 24 hours; leave some hours for the base rate or choose Flat 24 hours";
  return errors;
}

export function hasTariffErrors(errors: TariffErrors): boolean {
  return Boolean(errors.base || errors.form || errors.bands?.some(Boolean));
}

// Angka tarif dari input teks: menerima format Indonesia ("1.444,70") maupun titik desimal ("1444.7").
export function parseRate(raw: string): number {
  const s = raw.trim().replace(/^rp\s*/i, "").replace(/\s/g, "");
  if (s === "") return Number.NaN;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN;
}
