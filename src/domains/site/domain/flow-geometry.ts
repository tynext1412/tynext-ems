// Geometri murni untuk animasi aliran: jalur kabel sebagai polyline dan partikel
// yang bergerak di sepanjangnya. Tidak bergantung pada three.js supaya bisa diuji di node.
export type Vec3 = readonly [number, number, number];
export type Tuple3 = [number, number, number];

export const toTuple = (p: Vec3): Tuple3 => [p[0], p[1], p[2]];

const EPSILON = 0.05; // kW

function dist(a: Vec3, b: Vec3): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

export function polylineLength(points: readonly Vec3[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

// Titik pada fraksi t ∈ [0,1] dari panjang polyline (dijepit di ujung).
export function pointAt(points: readonly Vec3[], t: number): Vec3 {
  if (points.length === 0) return [0, 0, 0];
  if (points.length === 1) return points[0];
  const target = Math.min(1, Math.max(0, t)) * polylineLength(points);
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = dist(points[i - 1], points[i]);
    if (walked + seg >= target || i === points.length - 1) {
      const f = seg === 0 ? 0 : Math.min(1, (target - walked) / seg);
      const a = points[i - 1];
      const b = points[i];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
    walked += seg;
  }
  return points[points.length - 1];
}

// Jumlah partikel tumbuh logaritmik terhadap daya (1 kW → 2, 240 kW → 8), maksimal 8.
export function particleCount(kw: number): number {
  if (kw <= EPSILON) return 0;
  return Math.min(8, Math.max(1, 1 + Math.floor(Math.log2(kw + 1))));
}

// Kecepatan (satuan dunia per detik) naik linear sampai 500 kW lalu datar.
export function particleSpeed(kw: number): number {
  return 0.8 + (Math.min(Math.max(kw, 0), 500) / 500) * 1.6;
}
