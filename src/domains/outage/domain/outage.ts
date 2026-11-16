import type { PlantId } from "@/domains/plant/domain/plant";
import { addDays, localMidnightUtc } from "@/shared/domain/time";

// cx_off = controller sempat mati (melapor boot:true saat tersambung lagi); unknown = masih offline,
// penyebab baru diketahui saat controller online lagi.
export type OutageCause = "internet" | "cx_off" | "unknown";

// Koneksi MQTT controller (PLC) sebuah plant yang putus. Kontrak: skema Outage di OpenAPI backend.
export interface Outage {
  id: string;
  plantId: PlantId;
  deviceId: string; // controller yang koneksinya putus
  offlineAt: string; // waktu server saat status offline (Last Will) masuk
  lastTsBefore?: string; // sampel terakhir sebelum putus
  onlineAt?: string; // kosong = masih offline
  firstTsAfter?: string;
  cause: OutageCause;
}

const newest = (a: Outage | null, b: Outage, key: "offlineAt" | "onlineAt") => (!a || (b[key] ?? "") > (a[key] ?? "") ? b : a);

// Outage yang masih berjalan (paling baru), atau null.
export function ongoingOutage(outages: readonly Outage[]): Outage | null {
  return outages.filter((o) => !o.onlineAt).reduce<Outage | null>((cur, o) => newest(cur, o, "offlineAt"), null);
}

// Outage yang baru pulih dalam `withinMs` terakhir, untuk pesan "tersambung lagi".
export function recentlyRecovered(outages: readonly Outage[], now: number, withinMs = 10 * 60_000): Outage | null {
  return outages
    .filter((o) => o.onlineAt && now - Date.parse(o.onlineAt) <= withinMs)
    .reduce<Outage | null>((cur, o) => newest(cur, o, "onlineAt"), null);
}

// Awal rentang: sampel terakhir sebelum putus (Last Will baru masuk 5–9 s kemudian).
export function outageStart(o: Outage): string {
  return o.lastTsBefore ?? o.offlineAt;
}

// Pita di grafik harian, dalam menit sejak tengah malam lokal plant (sumbu x grafik).
export interface OutageBand {
  from: number;
  to: number;
  ongoing: boolean;
}

// Rentang outage yang jatuh di tanggal `dateKey` (zona plant), dipotong ke 00:00–24:00.
// Outage yang masih berjalan berakhir di `now`.
export function outageBands(outages: readonly Outage[], dateKey: string, timeZone: string, now: number): OutageBand[] {
  const dayStart = localMidnightUtc(dateKey, timeZone).getTime();
  const dayEnd = localMidnightUtc(addDays(dateKey, 1), timeZone).getTime();
  const minutes = (t: number) => (Math.min(Math.max(t, dayStart), dayEnd) - dayStart) / 60_000;
  return outages
    .flatMap((o) => {
      const start = Date.parse(outageStart(o));
      const end = o.onlineAt ? Date.parse(o.onlineAt) : now;
      return end <= dayStart || start >= dayEnd || end < start ? [] : [{ from: minutes(start), to: minutes(end), ongoing: !o.onlineAt }];
    })
    .sort((a, b) => a.from - b.from);
}

// "45 s", "3 min", "1 h 5 min".
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${h} h` : `${h} h ${m % 60} min`;
}
