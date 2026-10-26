import { batteryStatus, type PowerSample } from "./power-snapshot";

export type FlowNode = "pv" | "battery" | "genset" | "grid" | "load";

export interface FlowEdge {
  from: FlowNode;
  to: FlowNode;
  kw: number; // selalu > 0; arah ada di from→to
}

export type BatteryState = "charging" | "discharging" | "idle";
export type GridState = "import" | "export" | "idle";

export interface EnergyFlow {
  edges: FlowEdge[];
  batteryState: BatteryState;
  gridState: GridState;
}

const EPSILON = 0.05; // kW; di bawah ini dianggap nol

// Mengurai snapshot menjadi aliran antar node untuk diagram. Sumber dialirkan
// ke beban dengan prioritas PV → baterai → genset → grid; kelebihan PV mengisi
// baterai lalu diekspor ke grid.
export function deriveEnergyFlow(s: PowerSample): EnergyFlow {
  const edges: FlowEdge[] = [];
  let remainingLoad = Math.max(0, s.loadKW);

  const supply = (from: FlowNode, available: number) => {
    const kw = Math.min(available, remainingLoad);
    if (kw > EPSILON) {
      edges.push({ from, to: "load", kw });
      remainingLoad -= kw;
    }
    return available - Math.max(0, kw);
  };

  let pvSurplus = supply("pv", Math.max(0, s.pvKW));

  const status = batteryStatus(s.batteryKW);
  const batteryState: BatteryState = status === "CHARGING" ? "charging" : status === "DISCHARGING" ? "discharging" : "idle";
  if (batteryState === "discharging") {
    supply("battery", -s.batteryKW);
  } else if (batteryState === "charging") {
    const charge = Math.min(s.batteryKW, pvSurplus);
    if (charge > EPSILON) {
      edges.push({ from: "pv", to: "battery", kw: charge });
      pvSurplus -= charge;
    }
  }

  supply("genset", Math.max(0, s.gensetKW));

  const gridState: GridState = s.gridKW > EPSILON ? "import" : s.gridKW < -EPSILON ? "export" : "idle";
  if (gridState === "import") {
    supply("grid", s.gridKW);
  } else if (gridState === "export" && pvSurplus > EPSILON) {
    edges.push({ from: "pv", to: "grid", kw: Math.min(pvSurplus, -s.gridKW) });
  }

  return { edges, batteryState, gridState };
}

export function edgeBetween(flow: EnergyFlow, from: FlowNode, to: FlowNode): FlowEdge | undefined {
  return flow.edges.find((e) => e.from === from && e.to === to);
}
