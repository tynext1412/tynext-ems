import { timezoneAbbrev, zoneOffsetMinutes } from "@/shared/domain/time";

// Pemformat khusus halaman Information: tanggal singkat "11 Jul 2023" dan "11 Jul 2023 00:42 WIB".

export function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDateTime(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("id-ID", { timeZone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")} ${get("hour")}:${get("minute")} ${timezoneAbbrev(timeZone)}`;
}

// "Asia/Jakarta (WIB, UTC+07:00)"
export function formatTimeZone(timeZone: string): string {
  const minutes = zoneOffsetMinutes(timeZone, new Date());
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const offset = `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  return `${timeZone} (${timezoneAbbrev(timeZone)}, ${offset})`;
}

// "N0.789300, E102.074100"
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat < 0 ? "S" : "N"}${Math.abs(lat).toFixed(6)}, ${lng < 0 ? "W" : "E"}${Math.abs(lng).toFixed(6)}`;
}
