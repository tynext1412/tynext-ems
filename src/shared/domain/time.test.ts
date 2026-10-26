import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDateKey, formatRelative, localHour, localMidnightUtc, timezoneAbbrev, toDateKey, zoneOffsetMinutes } from "./time";

describe("time", () => {
  it("converts UTC instants to plant local hour", () => {
    const t = new Date("2026-10-26T01:30:00Z");
    expect(localHour(t, "Asia/Jakarta")).toBeCloseTo(8.5);
    expect(localHour(t, "Asia/Makassar")).toBeCloseTo(9.5);
    expect(localHour(t, "Asia/Jayapura")).toBeCloseTo(10.5);
  });

  it("derives the local date key across the midnight boundary", () => {
    expect(toDateKey(new Date("2026-10-25T17:30:00Z"), "Asia/Jakarta")).toBe("2026-10-26");
    expect(toDateKey(new Date("2026-10-25T16:30:00Z"), "Asia/Jakarta")).toBe("2026-10-25");
  });

  it("does date arithmetic on keys", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(daysBetween("2026-10-01", "2026-10-26")).toBe(25);
    expect(formatDateKey("2026-10-26")).toBe("26/10/2026");
  });

  it("formats relative time in Indonesian", () => {
    const now = new Date("2026-10-26T08:00:00Z").getTime();
    expect(formatRelative("2026-10-26T07:58:00Z", now)).toBe("2 menit lalu");
    expect(formatRelative("2026-10-26T07:59:50Z", now)).toBe("baru saja");
    expect(formatRelative("2026-10-26T05:00:00Z", now)).toBe("3 jam lalu");
  });

  it("resolves zone offsets and local midnight", () => {
    const at = new Date("2026-10-26T00:00:00Z");
    expect(zoneOffsetMinutes("Asia/Jakarta", at)).toBe(420);
    expect(zoneOffsetMinutes("Asia/Jayapura", at)).toBe(540);
    expect(localMidnightUtc("2026-10-26", "Asia/Makassar").toISOString()).toBe("2026-10-25T16:00:00.000Z");
  });

  it("maps IANA zones to Indonesian abbreviations", () => {
    expect(timezoneAbbrev("Asia/Makassar")).toBe("WITA");
    expect(timezoneAbbrev("Europe/Berlin")).toBe("Europe/Berlin");
  });
});
