// Warna seri chart: slot palet kategorikal dalam URUTAN TETAP yang lolos validator
// dataviz di surface putih #ffffff (adjacent CVD ΔE ≥ 8,4; kontras ≥ 3:1).
// Warna mengikuti entitas, bukan urutan tampil: Grid selalu biru, PV selalu oranye, dst.
export const SERIES_COLOR = {
  grid: "#3987e5",
  pv: "#d95926",
  battery: "#199e70",
  genset: "#c98500",
  load: "#d55181",
  purchase: "#008300",
  feedIn: "#9085e9",
} as const;

export type SeriesKey = keyof typeof SERIES_COLOR;

export const SERIES_LABEL: Record<SeriesKey, string> = {
  grid: "Grid",
  pv: "PV",
  battery: "Battery",
  genset: "Generator",
  load: "Load",
  purchase: "Purchase tariff",
  feedIn: "Feed-in tariff",
};

// Chrome chart memakai token tema (var CSS diterima atribut presentasi SVG) supaya ikut
// berubah saat tema diganti: grid hairline = separator, sumbu = border, tinta = muted.
export const CHART_CHROME = {
  surface: "var(--color-surface)",
  grid: "var(--color-separator)",
  axis: "var(--color-border)",
  ink: "var(--color-muted)",
  marker: "var(--color-muted)",
} as const;

export const AXIS_TICK = { fill: CHART_CHROME.ink, fontSize: 11 } as const;

export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(".", ",")}K`;
  return `${Math.round(value)}`;
}
