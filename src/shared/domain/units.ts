// Shared kernel: satuan dan pemformat angka yang dipakai semua domain.
// Nilai disimpan sebagai number dengan satuan di nama field (…KWh, …IDR);
// pemformatan ke tampilan hanya terjadi lewat fungsi di sini.

export type KWh = number;
export type KWp = number;
export type KW = number;
export type IDR = number;
export type Ton = number;

const numberFormatters = new Map<number, Intl.NumberFormat>();

function formatter(fractionDigits: number): Intl.NumberFormat {
  let f = numberFormatters.get(fractionDigits);
  if (!f) {
    f = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    numberFormatters.set(fractionDigits, f);
  }
  return f;
}

export function formatNumber(value: number, fractionDigits = 2): string {
  return formatter(fractionDigits).format(value);
}

export function formatKWh(value: KWh, fractionDigits = 2): string {
  return `${formatNumber(value, fractionDigits)} kWh`;
}

export function formatKWp(value: KWp, fractionDigits = 2): string {
  return `${formatNumber(value, fractionDigits)} kWp`;
}

export function formatKW(value: KW, fractionDigits = 2): string {
  return `${formatNumber(value, fractionDigits)} kW`;
}

export function formatTon(value: Ton, fractionDigits = 2): string {
  return `${formatNumber(value, fractionDigits)} t`;
}

export function formatIDR(value: IDR): string {
  return `Rp ${formatNumber(value, 0)}`;
}

export interface ScaledEnergy {
  value: string;
  unit: "kWh" | "MWh" | "GWh";
}

// Kartu summary butuh angka ringkas: 35.093.936 kWh → 35,09 GWh.
export function scaleEnergy(value: KWh, fractionDigits = 2): ScaledEnergy {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return { value: formatNumber(value / 1_000_000, fractionDigits), unit: "GWh" };
  if (abs >= 1_000_000) return { value: formatNumber(value / 1_000, fractionDigits), unit: "MWh" };
  return { value: formatNumber(value, fractionDigits), unit: "kWh" };
}

export interface ScaledIDR {
  value: string;
  unit: "" | "K" | "M" | "B" | "T";
}

// Rp 43.396.698.905 → 43,40 M (miliar).
export function scaleIDR(value: IDR, fractionDigits = 2): ScaledIDR {
  const abs = Math.abs(value);
  if (abs >= 1e12) return { value: formatNumber(value / 1e12, fractionDigits), unit: "T" };
  if (abs >= 1e9) return { value: formatNumber(value / 1e9, fractionDigits), unit: "B" };
  if (abs >= 1e6) return { value: formatNumber(value / 1e6, fractionDigits), unit: "M" };
  if (abs >= 1e3) return { value: formatNumber(value / 1e3, fractionDigits), unit: "K" };
  return { value: formatNumber(value, 0), unit: "" };
}
