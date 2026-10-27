import { deriveEnergyFlow, type FlowNode } from "@/domains/telemetry/domain/energy-flow";
import type { PowerSample } from "@/domains/telemetry/domain/power-snapshot";
import { formatNumber } from "@/shared/domain/units";

// Konektor tiap node ke bus AC, dipakai bersama oleh diagram 2D (SVG) dan adegan 3D.
export type FlowDirection = "to-bus" | "from-bus" | "none";

export interface Connector {
  kw: number;
  direction: FlowDirection;
  caption?: string;
}

export const FLOW_NODES: readonly FlowNode[] = ["pv", "genset", "grid", "load", "battery"];

export const FLOW_NODE_LABEL: Record<FlowNode, string> = { pv: "PV", genset: "Genset", grid: "Grid", load: "Load", battery: "Battery" };

// Warna kategori yang sama dengan grafik (urutan tervalidasi untuk buta warna).
export const FLOW_NODE_COLOR: Record<FlowNode, string> = { grid: "#3987e5", pv: "#d95926", battery: "#199e70", genset: "#c98500", load: "#d55181" };

const EPSILON = 0.05;

export function connectorFor(node: FlowNode, s: PowerSample, hasBattery: boolean): Connector {
  const flow = deriveEnergyFlow(s);
  switch (node) {
    case "pv":
      return { kw: s.pvKW, direction: s.pvKW > EPSILON ? "to-bus" : "none" };
    case "genset":
      return { kw: s.gensetKW, direction: s.gensetKW > EPSILON ? "to-bus" : "none" };
    case "grid":
      return {
        kw: Math.abs(s.gridKW),
        direction: flow.gridState === "import" ? "to-bus" : flow.gridState === "export" ? "from-bus" : "none",
        caption: flow.gridState === "import" ? "impor" : flow.gridState === "export" ? "ekspor" : undefined,
      };
    case "load":
      return { kw: s.loadKW, direction: s.loadKW > EPSILON ? "from-bus" : "none" };
    case "battery":
      if (!hasBattery) return { kw: 0, direction: "none", caption: "tidak terpasang" };
      return {
        kw: Math.abs(s.batteryKW),
        direction: flow.batteryState === "discharging" ? "to-bus" : flow.batteryState === "charging" ? "from-bus" : "none",
        caption: flow.batteryState === "discharging" ? "discharge" : flow.batteryState === "charging" ? "charge" : `SoC ${s.socPercent}%`,
      };
  }
}

export function describeFlow(s: PowerSample, hasBattery: boolean): string {
  const parts = [`PV ${formatNumber(s.pvKW, 1)} kW`, `beban ${formatNumber(s.loadKW, 1)} kW`, `genset ${formatNumber(s.gensetKW, 1)} kW`];
  if (hasBattery) parts.push(`baterai ${formatNumber(Math.abs(s.batteryKW), 1)} kW, SoC ${s.socPercent}%`);
  parts.push(`grid ${formatNumber(Math.abs(s.gridKW), 1)} kW ${s.gridKW >= 0 ? "impor" : "ekspor"}`);
  return parts.join(", ");
}
