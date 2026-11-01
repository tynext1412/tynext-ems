import type { WeatherCondition } from "@/domains/plant/domain/plant";

// Parameter efek cuaca di diorama 3D per kondisi cuaca plant saat ini. Data murni: komponen
// 3D (ui/flow3d/WeatherEffects.tsx) hanya membaca angka ini.
export interface WeatherFx {
  sun: boolean; // matahari berputar pelan di langit
  clouds: number; // jumlah awan melayang
  cloudColor: string;
  rain: number; // jumlah tetes hujan (0 = tidak hujan)
  rainSpeed: number; // satuan dunia per detik
  lightning: boolean;
  light: { sun: number; ambient: number; tint: string }; // pengali intensitas + warna cahaya matahari
  sky: [string, string]; // gradien langit di belakang kanvas (atas → bawah), rgba
}

export const WEATHER_FX: Record<WeatherCondition, WeatherFx> = {
  CLEAR: {
    sun: true,
    clouds: 0,
    cloudColor: "#ffffff",
    rain: 0,
    rainSpeed: 0,
    lightning: false,
    light: { sun: 1.05, ambient: 1, tint: "#fff4dc" },
    sky: ["rgba(186, 222, 255, 0.55)", "rgba(186, 222, 255, 0)"],
  },
  PARTLY_CLOUDY: {
    sun: true,
    clouds: 3,
    cloudColor: "#ffffff",
    rain: 0,
    rainSpeed: 0,
    lightning: false,
    light: { sun: 0.9, ambient: 1, tint: "#fff7e8" },
    sky: ["rgba(196, 220, 240, 0.5)", "rgba(196, 220, 240, 0)"],
  },
  CLOUDY: {
    sun: false,
    clouds: 6,
    cloudColor: "#e9ecef",
    rain: 0,
    rainSpeed: 0,
    lightning: false,
    light: { sun: 0.6, ambient: 1.15, tint: "#eef2f6" },
    sky: ["rgba(176, 186, 198, 0.5)", "rgba(176, 186, 198, 0)"],
  },
  RAIN: {
    sun: false,
    clouds: 7,
    cloudColor: "#c3c9d0",
    rain: 700,
    rainSpeed: 9,
    lightning: false,
    light: { sun: 0.45, ambient: 1.1, tint: "#dfe7ef" },
    sky: ["rgba(132, 146, 162, 0.55)", "rgba(132, 146, 162, 0.05)"],
  },
  THUNDERSTORM: {
    sun: false,
    clouds: 8,
    cloudColor: "#9aa2ab",
    rain: 1100,
    rainSpeed: 12,
    lightning: true,
    light: { sun: 0.32, ambient: 0.95, tint: "#cfd8e3" },
    sky: ["rgba(88, 98, 112, 0.6)", "rgba(88, 98, 112, 0.08)"],
  },
};

// Petir: titik-titik zigzag dari awan ke permukaan panggung, deterministik dari `seed`.
export function lightningBolt(seed: number, x: number, z: number, top = 5.6): [number, number, number][] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const steps = 7;
  const points: [number, number, number][] = [];
  let px = x;
  for (let i = 0; i <= steps; i++) {
    const y = top - (top / steps) * i;
    points.push([px, y, z]);
    px += (rand() - 0.5) * 0.9;
  }
  return points;
}

// Pola kedipan petir: dua kilatan cepat (0–0,09 s dan 0,16–0,26 s), selesai di 0,32 s.
export const FLASH_DURATION = 0.32;
export function flashLevel(t: number): number {
  if (t < 0 || t >= FLASH_DURATION) return 0;
  return t < 0.09 || (t >= 0.16 && t < 0.26) ? 1 : 0;
}

// Jeda acak antar petir (detik) dari bilangan acak 0..1.
export function nextFlashDelay(random: number): number {
  return 4 + random * 5;
}
