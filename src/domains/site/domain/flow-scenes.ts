import type { PlantType } from "@/domains/plant/domain/plant";
import type { FlowNode } from "@/domains/telemetry/domain/energy-flow";
import type { Vec3 } from "./flow-geometry";

// Konfigurasi adegan 3D per jenis site. Semua site punya komponen EMS yang sama (PV, baterai,
// grid, genset, beban, busbar AC); yang berbeda hanya model beban, dekorasi, pohon, dan warna
// panggung. Kode render, cahaya, kabel, dan label ditulis sekali di builder (ui/flow3d) dan
// membaca konfigurasi ini, jadi menambah jenis site cukup dengan menambah satu entri di sini.
// Sumbu: x ke kanan, z ke arah kamera, y ke atas; permukaan panggung di y = 0.

export type LoadModel = "factory" | "resort" | "processing";
export type TreeKind = "broadleaf" | "palm";

export interface Area {
  x: number; // pusat
  z: number;
  w: number; // lebar (sumbu x)
  d: number; // dalam (sumbu z)
}

export interface TreeArea extends Area {
  count: number;
  kind: TreeKind;
}

export type PropSpec =
  | { kind: "waterTower"; x: number; z: number }
  | { kind: "silo"; x: number; z: number; radius?: number; height?: number }
  | { kind: "excavator"; x: number; z: number; rotation: number }
  | { kind: "haulTruck"; x: number; z: number; rotation: number }
  | { kind: "stockpile"; x: number; z: number; radius: number; height: number }
  | { kind: "terraces"; x: number; z: number; scale: number }
  | { kind: "pool"; x: number; z: number; w: number; d: number }
  | { kind: "conveyor"; x: number; z: number; rotation: number };

export interface NodePlacement {
  x: number;
  z: number;
  top: number; // tinggi puncak objek; label diletakkan di atasnya
  labelLift?: number; // tambahan tinggi label bila labelnya bertumpuk dengan label objek di depannya
}

export interface SiteSceneConfig {
  stage: { w: number; d: number; top: string; side: string };
  bus: { x: number; z: number; length: number; height: number };
  nodes: Record<FlowNode, NodePlacement>;
  load: { model: LoadModel };
  pv: { rows: number; cols: number; elevated?: boolean };
  trees: TreeArea[];
  props: PropSpec[];
  paths: Area[]; // jalan setapak / jalan lingkungan di permukaan panggung
  seed: number;
}

export const CABLE_Y = 0.09; // di atas pad beton (tinggi 0,05) supaya kabel tidak tenggelam
export const LABEL_GAP = 0.35; // jarak titik label di atas puncak objek
const LANE_OFFSET = 0.35; // jalur kabel dari belakang dan dari depan busbar tidak bertumpuk

// Urutan tap di busbar dari kiri ke kanan, sesuai posisi sumbernya di panggung.
const TAP_ORDER: Record<FlowNode, number> = { pv: -1, battery: -0.5, load: 0, grid: 0.5, genset: 1 };

// Posisi peralatan sama di semua jenis site supaya pengguna langsung mengenali tata letaknya.
// Panggung dibuat panoramik (lebar, dangkal) karena kartu adegan jauh lebih lebar daripada tingginya.
const EQUIPMENT: Pick<SiteSceneConfig, "bus" | "nodes"> = {
  bus: { x: 0, z: 0.5, length: 3, height: 1.05 },
  nodes: {
    load: { x: 0, z: -1.9, top: 2.7 },
    pv: { x: -6.6, z: -1.5, top: 1.1, labelLift: 1.2 },
    battery: { x: -2.2, z: 2.2, top: 1.15 },
    grid: { x: 6.0, z: -1.2, top: 2.85 },
    genset: { x: 3.9, z: 2.3, top: 1.3 },
  },
};

const STAGE_SIZE = { w: 18, d: 8 };
const PATHS: Area[] = [
  { x: 1.75, z: 2.5, w: 1.0, d: 3.0 },
  { x: 0, z: -0.6, w: 4.8, d: 0.5 },
];

export const SITE_SCENES: Record<PlantType, SiteSceneConfig> = {
  PLANTATION: {
    ...EQUIPMENT,
    stage: { ...STAGE_SIZE, top: "#dfe3d8", side: "#b9c0b1" },
    load: { model: "factory" },
    pv: { rows: 2, cols: 4 },
    trees: [
      { x: -0.4, z: -3.45, w: 13.6, d: 0.8, count: 12, kind: "broadleaf" },
      { x: -8.3, z: 2.2, w: 0.9, d: 3.0, count: 3, kind: "broadleaf" },
      { x: 8.3, z: 1.0, w: 0.9, d: 5.4, count: 4, kind: "broadleaf" },
    ],
    props: [{ kind: "waterTower", x: 3.5, z: -2.6 }],
    paths: PATHS,
    seed: 11,
  },
  RESORT_HOTEL: {
    ...EQUIPMENT,
    stage: { ...STAGE_SIZE, top: "#e6e2d6", side: "#c4bda9" },
    load: { model: "resort" },
    pv: { rows: 2, cols: 4, elevated: true },
    trees: [
      { x: -3.2, z: -3.45, w: 8.6, d: 0.8, count: 5, kind: "palm" },
      { x: -8.3, z: 2.2, w: 0.9, d: 3.0, count: 2, kind: "palm" },
      { x: 8.3, z: 1.2, w: 0.9, d: 5.0, count: 3, kind: "palm" },
    ],
    props: [{ kind: "pool", x: 4.1, z: -2.8, w: 2.0, d: 1.1 }],
    paths: PATHS,
    seed: 23,
  },
  MINING: {
    ...EQUIPMENT,
    stage: { ...STAGE_SIZE, top: "#e3dccf", side: "#bfb3a0" },
    load: { model: "processing" },
    pv: { rows: 2, cols: 4 },
    trees: [
      { x: -8.3, z: 2.2, w: 0.9, d: 3.0, count: 2, kind: "broadleaf" },
      { x: 8.3, z: 1.4, w: 0.9, d: 4.6, count: 3, kind: "broadleaf" },
    ],
    props: [
      { kind: "stockpile", x: -7.4, z: -3.0, radius: 0.8, height: 0.7 },
      { kind: "excavator", x: -3.9, z: -3.0, rotation: -0.5 },
      { kind: "stockpile", x: 4.7, z: -3.1, radius: 0.75, height: 0.65 },
      { kind: "stockpile", x: 3.9, z: -3.45, radius: 0.5, height: 0.45 },
      { kind: "haulTruck", x: 1.75, z: 2.9, rotation: 1.57 },
    ],
    paths: [{ ...PATHS[0], w: 1.2 }, PATHS[1]],
    seed: 37,
  },
};

// Titik sambung node di busbar (di atas tiang busbar).
export function busTap(config: SiteSceneConfig, node: FlowNode): Vec3 {
  const { bus } = config;
  return [bus.x + TAP_ORDER[node] * (bus.length / 2 - 0.2), bus.height, bus.z];
}

// Jalur kabel: dari kaki objek di permukaan, menyusuri lajur belakang/depan busbar, lalu naik ke tap.
export function cablePath(config: SiteSceneConfig, node: FlowNode): Vec3[] {
  const n = config.nodes[node];
  const tap = busTap(config, node);
  const laneZ = config.bus.z + (n.z < config.bus.z ? -LANE_OFFSET : LANE_OFFSET);
  const raw: Vec3[] = [
    [n.x, CABLE_Y, n.z],
    [n.x, CABLE_Y, laneZ],
    [tap[0], CABLE_Y, laneZ],
    [tap[0], CABLE_Y, tap[2]],
    tap,
  ];
  return raw.filter((p, i) => i === 0 || p.some((v, k) => v !== raw[i - 1][k]));
}

export function labelAnchor(config: SiteSceneConfig, node: FlowNode): Vec3 {
  const n = config.nodes[node];
  return [n.x, n.top + LABEL_GAP + (n.labelLift ?? 0), n.z];
}

export function busLabelAnchor(config: SiteSceneConfig): Vec3 {
  const { bus } = config;
  return [bus.x + bus.length * 0.25, bus.height + 0.6, bus.z];
}

// Titik-titik yang harus terlihat oleh kamera: sudut panggung dan semua titik label.
export function framingPoints(config: SiteSceneConfig, nodes: readonly FlowNode[]): Vec3[] {
  const { w, d } = config.stage;
  const corners: Vec3[] = [];
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) for (const y of [-0.4, 0]) corners.push([x, y, z]);
  return [...corners, ...nodes.map((n) => labelAnchor(config, n)), busLabelAnchor(config)];
}

// ---- Penyebaran pohon: acak tapi deterministik per site supaya tidak berubah tiap render ----

export interface TreeInstance {
  x: number;
  z: number;
  scale: number;
  rotation: number;
  tone: number; // indeks palet 0..2
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sebar `count` pohon di area dengan jitter (bukan grid): area dibagi sel sejajar sisi
// terpanjang dan satu pohon diletakkan acak di dalam tiap sel, jadi tetap merata tanpa terlihat berbaris.
export function scatterTrees(area: TreeArea, seed: number): TreeInstance[] {
  const rand = mulberry32(seed);
  const alongX = area.w >= area.d;
  const length = alongX ? area.w : area.d;
  const cell = length / Math.max(1, area.count);
  const out: TreeInstance[] = [];
  for (let i = 0; i < area.count; i++) {
    const along = -length / 2 + cell * (i + 0.15 + rand() * 0.7);
    const across = (rand() - 0.5) * (alongX ? area.d : area.w) * 0.8;
    out.push({
      x: area.x + (alongX ? along : across),
      z: area.z + (alongX ? across : along),
      scale: 0.7 + rand() * 0.6,
      rotation: rand() * Math.PI * 2,
      tone: Math.floor(rand() * 3),
    });
  }
  return out;
}

// ---- Framing kamera: jarak terdekat agar semua titik masuk frustum ----

type V = readonly [number, number, number];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V, b: V): [number, number, number] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V, b: V): [number, number, number] => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): [number, number, number] => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export function centerOf(points: readonly Vec3[]): Vec3 {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of points)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], p[k]);
      max[k] = Math.max(max[k], p[k]);
    }
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
}

// Kamera di `center + dir × jarak`, menghadap center. Untuk tiap titik, jarak minimal agar
// |x| ≤ tanH × kedalaman dan |y| ≤ tanV × kedalaman; hasilnya maksimum dari semua titik.
export function fitDistance(points: readonly Vec3[], center: Vec3, direction: Vec3, tanH: number, tanV: number): number {
  const dir = norm(direction);
  const forward: [number, number, number] = [-dir[0], -dir[1], -dir[2]];
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  let dist = 0;
  for (const p of points) {
    const v = sub(p, center);
    const depthOffset = dot(v, dir);
    dist = Math.max(dist, depthOffset + Math.abs(dot(v, right)) / tanH, depthOffset + Math.abs(dot(v, up)) / tanV);
  }
  return dist;
}
