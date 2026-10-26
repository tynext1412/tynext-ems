import { describe, expect, it } from "vitest";
import { deriveEnergyFlow, edgeBetween } from "./energy-flow";
import { batteryStatus, type PowerSnapshot } from "./power-snapshot";

function snapshot(partial: Partial<PowerSnapshot>): PowerSnapshot {
  return { plantId: "PLT-1", at: "2026-10-26T04:00:00Z", pvKW: 0, loadKW: 0, gensetKW: 0, batteryKW: 0, gridKW: 0, socPercent: 50, ...partial };
}

describe("batteryStatus", () => {
  it("follows the spec sign convention: charge positive, discharge negative", () => {
    expect(batteryStatus(12.3)).toBe("CHARGING");
    expect(batteryStatus(-8)).toBe("DISCHARGING");
    expect(batteryStatus(0.01)).toBe("IDLE");
  });
});

describe("deriveEnergyFlow", () => {
  it("routes PV surplus to battery then grid when PV exceeds load", () => {
    const flow = deriveEnergyFlow(snapshot({ pvKW: 75.4, loadKW: 50, batteryKW: 20, gridKW: -5.4 }));

    expect(edgeBetween(flow, "pv", "load")?.kw).toBeCloseTo(50);
    expect(edgeBetween(flow, "pv", "battery")?.kw).toBeCloseTo(20);
    expect(edgeBetween(flow, "pv", "grid")?.kw).toBeCloseTo(5.4);
    expect(flow.batteryState).toBe("charging");
    expect(flow.gridState).toBe("export");
  });

  it("covers load from battery, genset, then grid at night", () => {
    const flow = deriveEnergyFlow(snapshot({ pvKW: 0, loadKW: 70.5, batteryKW: -30, gensetKW: 20, gridKW: 20.5 }));

    expect(edgeBetween(flow, "pv", "load")).toBeUndefined();
    expect(edgeBetween(flow, "battery", "load")?.kw).toBeCloseTo(30);
    expect(edgeBetween(flow, "genset", "load")?.kw).toBeCloseTo(20);
    expect(edgeBetween(flow, "grid", "load")?.kw).toBeCloseTo(20.5);
    expect(flow.batteryState).toBe("discharging");
    expect(flow.gridState).toBe("import");
  });

  it("produces no edges when everything is idle", () => {
    const flow = deriveEnergyFlow(snapshot({}));
    expect(flow.edges).toEqual([]);
    expect(flow.batteryState).toBe("idle");
    expect(flow.gridState).toBe("idle");
  });

  it("keeps the power balance: supply equals demand", () => {
    const s = snapshot({ pvKW: 60, loadKW: 45, batteryKW: 10, gridKW: -5 });
    const flow = deriveEnergyFlow(s);
    const intoLoad = flow.edges.filter((e) => e.to === "load").reduce((sum, e) => sum + e.kw, 0);
    const outOfPv = flow.edges.filter((e) => e.from === "pv").reduce((sum, e) => sum + e.kw, 0);
    expect(intoLoad).toBeCloseTo(45);
    expect(outOfPv).toBeCloseTo(60);
  });
});
