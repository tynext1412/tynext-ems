import { parseDateKey } from "@/shared/domain/time";

// Tanggal jadwal: "07 Dec 2026" (tabel) atau "07 December 2026" (panel detail).
export function formatScheduleDate(dateKey: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: style === "long" ? "long" : "short", year: "numeric" }).format(parseDateKey(dateKey));
}

// Waktu dibuat: "24 October 2026, 08:00" dalam zona waktu plant.
export function formatCreatedAt(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}
