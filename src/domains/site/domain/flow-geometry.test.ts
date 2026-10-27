import { describe, expect, it } from "vitest";
import { PLANT_TYPES } from "@/domains/plant/domain/plant";
import { connectorFor, FLOW_NODES } from "./flow-connectors";
import { particleCount, particleSpeed, pointAt, polylineLength } from "./flow-geometry";
import { cablePath, FLOW_LAYOUTS } from "./flow-layouts";

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

describe("flow layouts", () => {
  it("defines anchors, labels and a cable to the bus for every node of every site kind", () => {
    for (const type of PLANT_TYPES) {
      const layout = FLOW_LAYOUTS[type];
      for (const node of FLOW_NODES) {
        expect(layout.anchors[node]).toHaveLength(3);
        expect(layout.labels[node][1]).toBeGreaterThan(layout.anchors[node][1]);
        const path = cablePath(layout, node);
        expect(path[0]).toEqual(layout.anchors[node]);
        expect(path[path.length - 1]).toEqual(layout.bus);
        for (const p of path.slice(1, -1)) expect(p[1]).toBeCloseTo(0.06);
        for (let i = 1; i < path.length; i++) expect(path[i]).not.toEqual(path[i - 1]);
      }
    }
  });
});

describe("connectorFor", () => {
  const s = { at: "2026-10-27T05:00:00Z", pvKW: 240.3, loadKW: 188.9, gensetKW: 0, batteryKW: 0, gridKW: -51.4, socPercent: 80 };
  it("maps sample signs to directions and captions", () => {
    expect(connectorFor("pv", s, false)).toEqual({ kw: 240.3, direction: "to-bus" });
    expect(connectorFor("grid", s, false)).toEqual({ kw: 51.4, direction: "from-bus", caption: "ekspor" });
    expect(connectorFor("genset", s, false).direction).toBe("none");
    expect(connectorFor("battery", s, false)).toEqual({ kw: 0, direction: "none", caption: "tidak terpasang" });
    expect(connectorFor("battery", { ...s, batteryKW: -20 }, true)).toEqual({ kw: 20, direction: "to-bus", caption: "discharge" });
  });
});
