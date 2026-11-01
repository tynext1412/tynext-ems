import type { Theme } from "@/shared/lib/theme";

// Warna lingkungan adegan 3D per tema (objek peralatan tetap; hanya tanah, kabut, grid, cahaya).
export interface ScenePalette {
  fog: string;
  ground: string;
  gridCell: string;
  gridSection: string;
  cableIdle: string;
  lawn: string;
  dirt: string;
  soil: string;
  ambient: number;
  sun: number;
  skyLight: string;
  groundLight: string;
}

export const SCENE_PALETTE: Record<Theme, ScenePalette> = {
  light: { fog: "#f5f5f5", ground: "#ebecee", gridCell: "#cfd2d6", gridSection: "#b4b8be", cableIdle: "#b5bcc3", lawn: "#bfd9c2", dirt: "#dccfbb", soil: "#cdbc9f", ambient: 0.8, sun: 1.3, skyLight: "#ffffff", groundLight: "#cfd4d9" },
  dark: { fog: "#141516", ground: "#1b1e21", gridCell: "#30353a", gridSection: "#3d444a", cableIdle: "#3a3f44", lawn: "#243a2b", dirt: "#3a3128", soil: "#3a2f23", ambient: 0.55, sun: 1.5, skyLight: "#cfe8ff", groundLight: "#2a2d30" },
};
