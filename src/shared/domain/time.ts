// Shared kernel: waktu lokal plant (WIB/WITA/WIT) dan pemformat tanggal id-ID.

const TZ_ABBREV: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

export function timezoneAbbrev(timeZone: string): string {
  return TZ_ABBREV[timeZone] ?? timeZone;
}

export function localHour(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour + minute / 60;
}

// YYYY-MM-DD menurut zona waktu plant.
export function toDateKey(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Offset zona waktu (menit) pada instan tertentu; Indonesia tidak punya DST.
export function zoneOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

// Instan UTC untuk tengah malam lokal plant pada tanggal YYYY-MM-DD.
export function localMidnightUtc(dateKey: string, timeZone: string): Date {
  const guess = parseDateKey(dateKey); // 00:00 UTC
  const offset = zoneOffsetMinutes(timeZone, guess);
  return new Date(guess.getTime() - offset * 60_000);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86_400_000);
}

export function formatDateKey(key: string, style: "short" | "long" = "short"): string {
  const d = parseDateKey(key);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: style === "long" ? "long" : "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

// Hash string → seed 32-bit (djb2), untuk data dummy deterministik per tanggal.
export function hashSeed(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h;
}
