import { describe, expect, it } from "vitest";
import type { Alarm } from "./alarm";
import { alarmDurationMs, deviceTypeFromId, formatAlarmTime, formatDuration, matchesAlarmFilter, splitAlarms } from "./alarm-presentation";

const alarm = (over: Partial<Alarm> = {}): Alarm => ({
  id: "A",
  plantId: "PLT-003",
  deviceId: "PLT-003-INV-01",
  code: "INV_OVER_TEMP",
  severity: "WARNING",
  message: "Suhu internal inverter di atas 65 °C",
  raisedAt: "2026-10-28T07:48:00.000Z",
  ...over,
});

describe("deviceTypeFromId", () => {
  it("reads the device segment of the id", () => {
    expect(deviceTypeFromId("PLT-003-INV-01")).toBe("INVERTER");
    expect(deviceTypeFromId("PLT-003-BAT-02")).toBe("BATTERY");
    expect(deviceTypeFromId("PLT-003-PCS-01")).toBe("PCS");
    expect(deviceTypeFromId("PLT-003-MTR-01")).toBe("METER");
    expect(deviceTypeFromId("plt-003-log-01")).toBe("LOGGER");
    expect(deviceTypeFromId("1929073577500789")).toBe("UNKNOWN");
  });
});

describe("alarm duration", () => {
  it("runs until recovery, or until now while active", () => {
    const now = Date.parse("2026-10-28T09:00:00.000Z");
    expect(alarmDurationMs(alarm(), now)).toBe(72 * 60_000);
    expect(alarmDurationMs(alarm({ clearedAt: "2026-10-28T08:07:00.000Z" }), now)).toBe(19 * 60_000);
    expect(alarmDurationMs(alarm({ raisedAt: "2026-10-28T10:00:00.000Z" }), now)).toBe(0);
  });

  it("formats minutes, hours and days", () => {
    expect(formatDuration(19 * 60_000)).toBe("19 min");
    expect(formatDuration(72 * 60_000)).toBe("1 h 12 min");
    expect(formatDuration(51 * 3_600_000)).toBe("2 d 3 h");
    expect(formatDuration(10_000)).toBe("< 1 min");
  });
});

describe("matchesAlarmFilter", () => {
  const a = alarm();
  it("filters by device type, severity, and free text over id / serial / message", () => {
    expect(matchesAlarmFilter(a, { search: "", deviceType: "ALL", severity: "ALL" })).toBe(true);
    expect(matchesAlarmFilter(a, { search: "", deviceType: "BATTERY", severity: "ALL" })).toBe(false);
    expect(matchesAlarmFilter(a, { search: "", deviceType: "INVERTER", severity: "CRITICAL" })).toBe(false);
    expect(matchesAlarmFilter(a, { search: "inv-01", deviceType: "ALL", severity: "ALL" })).toBe(true);
    expect(matchesAlarmFilter(a, { search: "2218", deviceType: "ALL", severity: "ALL" }, "2218510176341731")).toBe(true);
    expect(matchesAlarmFilter(a, { search: "suhu", deviceType: "ALL", severity: "ALL" })).toBe(true);
    expect(matchesAlarmFilter(a, { search: "grid", deviceType: "ALL", severity: "ALL" })).toBe(false);
  });
});

describe("splitAlarms / formatAlarmTime", () => {
  it("separates active from recovered and formats the local time", () => {
    const { active, recovered } = splitAlarms([alarm(), alarm({ id: "B", clearedAt: "2026-10-28T08:07:00.000Z" })]);
    expect(active.map((x) => x.id)).toEqual(["A"]);
    expect(recovered.map((x) => x.id)).toEqual(["B"]);
    expect(formatAlarmTime("2026-10-28T07:48:00.000Z", "Asia/Jakarta")).toBe("28 Oct 2026, 14:48");
  });
});
