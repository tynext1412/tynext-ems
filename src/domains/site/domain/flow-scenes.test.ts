import { describe, expect, it } from "vitest";
import { PLANT_TYPES } from "@/domains/plant/domain/plant";
import { FLOW_NODES } from "./flow-connectors";
import { busTap, CABLE_Y, cablePath, centerOf, fitDistance, framingPoints, labelAnchor, scatterTrees, SITE_SCENES } from "./flow-scenes";

describe("site scene configs", () => {
  it("routes a cable from every node along the stage surface up to its own bus tap", () => {
    for (const type of PLANT_TYPES) {
      const cfg = SITE_SCENES[type];
      const taps = new Set<string>();
      for (const node of FLOW_NODES) {
        const path = cablePath(cfg, node);
        const n = cfg.nodes[node];
        expect(path[0]).toEqual([n.x, CABLE_Y, n.z]);
        expect(path[path.length - 1]).toEqual(busTap(cfg, node));
        for (const p of path.slice(0, -1)) expect(p[1]).toBe(CABLE_Y);
        for (let i = 1; i < path.length; i++) expect(path[i]).not.toEqual(path[i - 1]);
        taps.add(busTap(cfg, node).join(","));
      }
      expect(taps.size).toBe(FLOW_NODES.length); // tiap node punya tap sendiri di busbar
    }
  });

  it("places every node, tree area and path inside the stage, with labels above the objects", () => {
    for (const type of PLANT_TYPES) {
      const cfg = SITE_SCENES[type];
      const inside = (x: number, z: number) => Math.abs(x) <= cfg.stage.w / 2 && Math.abs(z) <= cfg.stage.d / 2;
      for (const node of FLOW_NODES) {
        const n = cfg.nodes[node];
        expect(inside(n.x, n.z)).toBe(true);
        expect(labelAnchor(cfg, node)[1]).toBeGreaterThan(n.top);
      }
      for (const a of [...cfg.trees, ...cfg.paths]) {
        expect(inside(a.x - a.w / 2, a.z - a.d / 2) && inside(a.x + a.w / 2, a.z + a.d / 2)).toBe(true);
      }
    }
  });
});

describe("scatterTrees", () => {
  const area = { x: 1, z: -4, w: 10, d: 1, count: 8, kind: "broadleaf" as const };
  it("is deterministic per seed, stays inside the area and varies scale", () => {
    const a = scatterTrees(area, 7);
    expect(scatterTrees(area, 7)).toEqual(a);
    expect(scatterTrees(area, 8)).not.toEqual(a);
    expect(a).toHaveLength(8);
    for (const t of a) {
      expect(Math.abs(t.x - area.x)).toBeLessThanOrEqual(area.w / 2);
      expect(Math.abs(t.z - area.z)).toBeLessThanOrEqual(area.d / 2);
      expect(t.scale).toBeGreaterThanOrEqual(0.7);
      expect(t.scale).toBeLessThanOrEqual(1.3);
    }
    expect(new Set(a.map((t) => t.scale.toFixed(3))).size).toBeGreaterThan(1);
  });
});

describe("fitDistance", () => {
  it("returns the distance at which the widest point just touches the frustum edge", () => {
    // Titik ±2 di sumbu x, kamera di sumbu z, fov horizontal 90° (tan 1): jarak = 2.
    expect(fitDistance([[-2, 0, 0], [2, 0, 0]], [0, 0, 0], [0, 0, 1], 1, 1)).toBeCloseTo(2);
    // Fov lebih sempit → kamera lebih jauh.
    expect(fitDistance([[-2, 0, 0], [2, 0, 0]], [0, 0, 0], [0, 0, 1], 0.5, 1)).toBeCloseTo(4);
  });

  it("frames every stage corner and label of a real site", () => {
    const cfg = SITE_SCENES.PLANTATION;
    const pts = framingPoints(cfg, FLOW_NODES);
    const center = centerOf(pts);
    const dist = fitDistance(pts, center, [0.3, 0.85, 1], 0.7, 0.4);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(60);
  });
});
