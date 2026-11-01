import { describe, expect, it } from "vitest";
import { connectorFor } from "./flow-connectors";
import { particleCount, particleSpeed, pointAt, polylineLength } from "./flow-geometry";

const L = [
  [0, 0, 0],
  [3, 0, 0],
  [3, 4, 0],
] as const;

describe("flow geometry", () => {
  it("measures a polyline and samples points along it", () => {
    expect(polylineLength(L)).toBe(7);
    expect(pointAt(L, 0)).toEqual([0, 0, 0]);
    expect(pointAt(L, 1)).toEqual([3, 4, 0]);
    expect(pointAt(L, 0.5)).toEqual([3, 0.5, 0]);
    expect(pointAt(L, 2)).toEqual([3, 4, 0]);
  });

  it("scales particle count and speed with power, capped", () => {
    expect(particleCount(0)).toBe(0);
    expect(particleCount(1)).toBe(2);
    expect(particleCount(240)).toBe(8);
    expect(particleCount(5000)).toBe(8);
    expect(particleSpeed(0)).toBeCloseTo(0.8);
    expect(particleSpeed(500)).toBeCloseTo(2.4);
    expect(particleSpeed(5000)).toBeCloseTo(2.4);
  });
});

describe("connectorFor", () => {
  const s = { at: "2026-10-27T05:00:00Z", pvKW: 240.3, loadKW: 188.9, gensetKW: 0, batteryKW: 0, gridKW: -51.4, socPercent: 80 };
  it("maps sample signs to directions and captions", () => {
    expect(connectorFor("pv", s, false)).toEqual({ kw: 240.3, direction: "to-bus" });
    expect(connectorFor("grid", s, false)).toEqual({ kw: 51.4, direction: "from-bus", caption: "export" });
    expect(connectorFor("genset", s, false).direction).toBe("none");
    expect(connectorFor("battery", s, false)).toEqual({ kw: 0, direction: "none", caption: "not installed" });
    expect(connectorFor("battery", { ...s, batteryKW: -20 }, true)).toEqual({ kw: 20, direction: "to-bus", caption: "discharge" });
  });
});
