import type { Theme } from "@/shared/lib/theme";

// Warna dan cahaya lingkungan adegan 3D per tema. Warna panggung datang dari konfigurasi site
// (domain/flow-scenes.ts); di sini hanya kabel idle, garis penunjuk label, dan intensitas cahaya.
export interface ScenePalette {
  cableIdle: string;
  leader: string;
  ambient: number;
  sun: number;
  environment: number;
  skyLight: string;
  groundLight: string;
}

export const SCENE_PALETTE: Record<Theme, ScenePalette> = {
  light: { cableIdle: "#9aa1a8", leader: "#8a9097", ambient: 0.35, sun: 2.2, environment: 0.7, skyLight: "#ffffff", groundLight: "#d9dcd2" },
  dark: { cableIdle: "#5b6168", leader: "#6f767d", ambient: 0.25, sun: 1.6, environment: 0.45, skyLight: "#cfe8ff", groundLight: "#2a2d30" },
};
