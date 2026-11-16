import { describe, expect, it } from "vitest";
import { formatDuration, ongoingOutage, outageBands, recentlyRecovered, type Outage } from "./outage";

const base = { plantId: "PLT-015", deviceId: "PLT-015-LOG-01" } as const;
// 2026-11-16 10:00 WIB = 03:00Z
const closed: Outage = { ...base, id: "1", offlineAt: "2026-11-16T03:00:08Z", lastTsBefore: "2026-11-16T03:00:00Z", onlineAt: "2026-11-16T03:05:00Z", cause: "internet" };
const open: Outage = { ...base, id: "2", offlineAt: "2026-11-16T04:00:05Z", cause: "unknown" };
const now = Date.parse("2026-11-16T04:10:00Z");

describe("outage", () => {
  it("finds the ongoing outage and one that recovered recently", () => {
    expect(ongoingOutage([closed, open])).toBe(open);
    expect(ongoingOutage([closed])).toBeNull();
    expect(recentlyRecovered([closed], Date.parse("2026-11-16T03:09:00Z"))).toBe(closed);
    expect(recentlyRecovered([closed], now)).toBeNull(); // more than 10 minutes ago
  });

  it("turns outages into bands in plant-local minutes, ending ongoing ones now", () => {
    expect(outageBands([open, closed], "2026-11-16", "Asia/Jakarta", now)).toEqual([
      { from: 600, to: 605, ongoing: false }, // 10:00–10:05 WIB, from the last sample before
      { from: 660 + 5 / 60, to: 670, ongoing: true }, // 11:00:05 until now (11:10)
    ]);
    // Same instants in WITA (UTC+8) are one hour later on the axis.
    expect(outageBands([closed], "2026-11-16", "Asia/Makassar", now)[0]).toMatchObject({ from: 660, to: 665 });
  });

  it("clips outages that cross midnight and skips other days", () => {
    const overnight: Outage = { ...base, id: "3", offlineAt: "2026-11-15T16:50:00Z", onlineAt: "2026-11-15T17:20:00Z", cause: "internet" }; // 23:50–00:20 WIB
    expect(outageBands([overnight], "2026-11-15", "Asia/Jakarta", now)).toEqual([{ from: 1430, to: 1440, ongoing: false }]);
    expect(outageBands([overnight], "2026-11-16", "Asia/Jakarta", now)).toEqual([{ from: 0, to: 20, ongoing: false }]);
    expect(outageBands([overnight], "2026-11-14", "Asia/Jakarta", now)).toEqual([]);
  });

  it("formats durations", () => {
    expect(formatDuration(45_000)).toBe("45 s");
    expect(formatDuration(3 * 60_000)).toBe("3 min");
    expect(formatDuration(65 * 60_000)).toBe("1 h 5 min");
    expect(formatDuration(120 * 60_000)).toBe("2 h");
  });
});
