// Warna seri chart: slot palet kategorikal dalam URUTAN TETAP yang lolos validator
// dataviz di surface putih #ffffff (adjacent CVD ΔE ≥ 8,4; kontras ≥ 3:1).
// Warna mengikuti entitas, bukan urutan tampil: Grid selalu biru, PV selalu oranye, dst.
export const SERIES_COLOR = {
  grid: "#3987e5",
  pv: "#d95926",
  battery: "#199e70",
  genset: "#c98500",
  load: "#d55181",
  soc: "#199e70", // SOC = baterai, jadi warnanya sama dengan seri Battery
  // Tarif hanya tampil bersama SOC; hijau #008300 terlalu dekat dengan hijau SOC (ΔE 11,9),
  // jadi tarif beli memakai oranye: SOC/beli/jual lolos validator all-pairs terang & gelap.
  purchase: "#d95926",
  feedIn: "#9085e9",
  // Chart energi Month/Year/Lifetime (batang berkelompok, urutan PV, Import, Export, Charge,
  // Discharge, Consumption). PV/Import/Charge/Consumption memakai warna entitasnya (PV, Grid,
  // Battery, Load); urutan ini lolos validator pasangan bersebelahan di tema terang & gelap.
  import: "#3987e5",
  export: "#c98500",
  charge: "#199e70",
  discharge: "#9085e9",
  consumption: "#d55181",
} as const;

export type SeriesKey = keyof typeof SERIES_COLOR;

export const SERIES_LABEL: Record<SeriesKey, string> = {
  grid: "Grid",
  pv: "PV",
  battery: "Battery",
  genset: "Generator",
  load: "Load",
  soc: "SOC",
  purchase: "Purchase tariff",
  feedIn: "Feed-in tariff",
  import: "Import",
  export: "Export",
  charge: "Charge",
  discharge: "Discharge",
  consumption: "Consumption",
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

// Pita "controller offline" di grafik harian. Lebar minimal 4 menit (±2 px pada sumbu 24 jam)
// supaya putus singkat tetap terlihat.
// minFraction: lebar minimum pita = bagian dari rentang sumbu x yang terlihat (0,3% ≈ 4 menit untuk satu hari).
export const OUTAGE_BAND = { fill: "var(--color-warn)", fillOpacity: 0.24, minFraction: 0.003 } as const;

export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(".", ",")}K`;
  return `${Math.round(value)}`;
}

// Label sumbu Y untuk rentang sempit (mis. 7,1–7,4 kW atau 24,0–24,6 °C): bilangan bulat dan
// angka besar memakai compactNumber; pecahan di bawah 1.000 tetap menampilkan 1–2 desimal
// supaya label tidak berulang ("7, 7, 7").
export function axisNumber(value: number): string {
  if (Number.isInteger(value) || Math.abs(value) >= 1000) return compactNumber(value);
  const digits = Math.abs(value) < 10 ? 2 : 1;
  return value.toFixed(digits).replace(/\.?0+$/, "").replace(".", ",");
}
