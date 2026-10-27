// Deteksi WebGL sekali di awal; bila tidak ada, diagram memakai versi 2D (SVG).
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
