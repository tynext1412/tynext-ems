import type { GridConnectionStatus } from "./reading";

export { RUN_STATE_LABEL } from "./reading";

// Kode "Inverter Status" (enum dari vendor). Daftar ini mengikuti kode status inverter string
// FusionSolar yang paling umum; kode lain ditampilkan sebagai "Status <kode>" sampai backend
// mengirim daftar lengkapnya.
export const INVERTER_STATUS_LABEL: Readonly<Record<number, string>> = {
  0: "Standby: initializing",
  1: "Standby: insulation resistance detecting",
  2: "Standby: irradiation detecting",
  3: "Standby: grid detecting",
  256: "Starting",
  512: "On-grid",
  513: "On-grid: power limited",
  514: "On-grid: self-derating",
  768: "Shutdown: fault",
  769: "Shutdown: command",
  771: "Communication disconnected",
  40960: "Standby: no irradiation",
};

export type InverterStatusTone = "ok" | "warn" | "danger" | "neutral";

export function inverterStatusLabel(code: number): string {
  return INVERTER_STATUS_LABEL[code] ?? `Status ${code}`;
}

// Warna chip: on-grid = hijau, standby/starting = netral, terbatas = kuning, shutdown/putus = merah.
export function inverterStatusTone(code: number): InverterStatusTone {
  if (code === 512) return "ok";
  if (code === 513 || code === 514) return "warn";
  if (code >= 768 && code < 1024) return "danger";
  return "neutral";
}

export const GRID_CONNECTION_LABEL: Record<GridConnectionStatus, string> = { ON_GRID: "On-grid", OFF_GRID: "Off-grid" };
