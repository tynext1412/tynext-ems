import { describe, expect, it } from "vitest";
import { countActive, sortAlarms, type Alarm } from "./alarm";

const base: Alarm = { id: "A", plantId: "PLT-1", deviceId: "INV-1", code: "X", severity: "INFO", message: "", raisedAt: "2026-10-26T01:00:00Z" };

describe("alarm", () => {
  it("counts only alarms without clearedAt", () => {
    expect(countActive([base, { ...base, id: "B", clearedAt: "2026-10-26T02:00:00Z" }])).toBe(1);
  });

  it("sorts active first, then severity, then newest", () => {
    const alarms: Alarm[] = [
      { ...base, id: "cleared-critical", severity: "CRITICAL", clearedAt: "2026-10-26T02:00:00Z" },
      { ...base, id: "active-info-old", severity: "INFO", raisedAt: "2026-10-25T01:00:00Z" },
      { ...base, id: "active-warning", severity: "WARNING" },
      { ...base, id: "active-info-new", severity: "INFO", raisedAt: "2026-10-26T03:00:00Z" },
    ];
    expect(sortAlarms(alarms).map((a) => a.id)).toEqual(["active-warning", "active-info-new", "active-info-old", "cleared-critical"]);
  });
});
