import type { PlantType } from "@/domains/plant/domain/plant";
import type { FlowNode } from "@/domains/telemetry/domain/energy-flow";
import type { Vec3 } from "./flow-geometry";

// Tata letak adegan 3D per jenis site: posisi sambungan kabel tiap node, posisi label,
// dan kamera. Kabel ditarik di permukaan tanah dari node ke switchgear (bus AC).
export interface FlowLayout {
  camera: { position: Vec3; target: Vec3 };
  bus: Vec3;
  anchors: Record<FlowNode, Vec3>;
  labels: Record<FlowNode, Vec3>;
}

const CABLE_Y = 0.06;

const BASE: FlowLayout = {
  camera: { position: [0, 7.2, 10.6], target: [0, 0.2, -2.4] },
  bus: [0, 0.3, 0],
  anchors: { pv: [-5, 0.3, -2.5], grid: [5, 0.4, -3], genset: [4.5, 0.45, 2], battery: [-4.5, 0.5, 2], load: [0, 0.8, -5] },
  labels: { pv: [-5, 2.1, -2.5], grid: [5, 3.9, -3], genset: [4.5, 1.7, 2], battery: [-4.5, 1.9, 2], load: [0, 2.9, -5] },
};

export const FLOW_LAYOUTS: Record<PlantType, FlowLayout> = {
  RESORT_HOTEL: { ...BASE, anchors: { ...BASE.anchors, pv: [-5, 1.6, -2.5] }, labels: { ...BASE.labels, pv: [-5, 2.9, -2.5] } },
  MINING: {
    ...BASE,
    camera: { position: [0, 8.0, 11.5], target: [0, 0.2, -2.7] },
    anchors: { ...BASE.anchors, pv: [-5.5, 0.3, -2.8], load: [0, 1, -5.5] },
    labels: { ...BASE.labels, pv: [-5.5, 2.1, -2.8], load: [0, 3.6, -5.5] },
  },
  PLANTATION: { ...BASE, anchors: { ...BASE.anchors, load: [0, 0.8, -5.5] }, labels: { ...BASE.labels, load: [0, 3.2, -5.5] } },
};

// Jalur kabel: turun dari sambungan node ke tanah, siku mengikuti sumbu x lalu z, naik ke bus.
export function cablePath(layout: FlowLayout, node: FlowNode): Vec3[] {
  const [ax, ay, az] = layout.anchors[node];
  const [bx, by, bz] = layout.bus;
  const raw: Vec3[] = [[ax, ay, az], [ax, CABLE_Y, az], [bx, CABLE_Y, az], [bx, CABLE_Y, bz], [bx, by, bz]];
  return raw.filter((p, i) => i === 0 || p.some((v, k) => v !== raw[i - 1][k]));
}
