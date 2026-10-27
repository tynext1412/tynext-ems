import type { PlantId } from "@/domains/plant/domain/plant";

// Halaman SCADA tidak menggambar diagram sendiri: ia menyematkan viewer SCADA
// pihak ketiga (Ignition Perspective, FUXA, WebAccess, dsb.) lewat iframe.
// Konfigurasi ini yang menentukan apa yang disematkan untuk satu plant.
export interface ScadaEmbed {
  provider: string; // nama produk/plugin, hanya untuk label
  url: string; // URL viewer; boleh memakai placeholder {plantId}
  allowFullscreen: boolean;
}

export const PLANT_ID_PLACEHOLDER = "{plantId}";

export function resolveScadaUrl(embed: ScadaEmbed, plantId: PlantId): string {
  return embed.url.split(PLANT_ID_PLACEHOLDER).join(encodeURIComponent(plantId));
}

// Hanya http(s) atau path relatif aplikasi yang boleh disematkan; skema lain ditolak.
export function isEmbeddableUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
