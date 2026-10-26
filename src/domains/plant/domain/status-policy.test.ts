import { describe, expect, it } from "vitest";
import type { Device } from "./plant";
import { countByStatus, derivePlantStatus, inverterAvailability, isActive } from "./status-policy";

function device(partial: Partial<Device> & Pick<Device, "id">): Device {
  return { type: "INVERTER", vendor: "Huawei", connected: true, activeAlarms: 0, ...partial };
}

describe("derivePlantStatus", () => {
  it("is OFFLINE when there are no devices", () => {
    expect(derivePlantStatus([])).toBe("OFFLINE");
  });

  it("is ONLINE when all devices are connected without alarms", () => {
    expect(derivePlantStatus([device({ id: "INV-1" }), device({ id: "BAT-1", type: "BATTERY" })])).toBe("ONLINE");
  });

  it("is OFFLINE when all devices are disconnected", () => {
    expect(
      derivePlantStatus([device({ id: "INV-1", connected: false }), device({ id: "BAT-1", type: "BATTERY", connected: false })]),
    ).toBe("OFFLINE");
  });

  it("is ALARM when only some devices are disconnected", () => {
    expect(derivePlantStatus([device({ id: "INV-1" }), device({ id: "INV-2", connected: false })])).toBe("ALARM");
  });

  it("is ALARM when a connected device has an active alarm", () => {
    expect(derivePlantStatus([device({ id: "INV-1", activeAlarms: 1 })])).toBe("ALARM");
  });
});

describe("inverterAvailability", () => {
  it("counts only inverters", () => {
    const devices = [
      device({ id: "INV-1" }),
      device({ id: "INV-2", connected: false }),
      device({ id: "BAT-1", type: "BATTERY" }),
    ];
    expect(inverterAvailability(devices)).toEqual({ online: 1, total: 2 });
  });
});

describe("status helpers", () => {
  it("treats ONLINE and ALARM as active", () => {
    expect(isActive("ONLINE")).toBe(true);
    expect(isActive("ALARM")).toBe(true);
    expect(isActive("OFFLINE")).toBe(false);
  });

  it("counts plants per status", () => {
    expect(countByStatus([{ status: "ONLINE" }, { status: "ONLINE" }, { status: "OFFLINE" }])).toEqual({
      ONLINE: 2,
      ALARM: 0,
      OFFLINE: 1,
    });
  });
});
