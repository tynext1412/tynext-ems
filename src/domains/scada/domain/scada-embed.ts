import type { PlantId } from "@/domains/plant/domain/plant";

// Halaman SCADA tidak menggambar diagram sendiri: ia menyematkan viewer SCADA
// pihak ketiga (Ignition Perspective, FUXA, WebAccess, dsb.) lewat iframe.
// Konfigurasi ini yang menentukan apa yang disematkan untuk satu plant.
export interface ScadaEmbed {
  provider: string; // nama produk/plugin, hanya untuk label
  url: string; // URL viewer; boleh memakai placeholder {plantId}
  allowFullscreen: boolean;
  // Lebar/tinggi kanvas viewer (view FUXA 1280×860 → 1,488). Diisi = bingkai dijaga sebanding supaya viewer
  // yang meregangkan isinya ke ukuran bingkai (FUXA autoresize) tidak terdistorsi. Kosong = bingkai mengisi panel.
  aspectRatio?: number;
}

// Rasio yang dipakai bingkai; nilai di luar 0,5–4 diabaikan (bingkai mengisi panel).
export function frameAspectRatio(embed: ScadaEmbed): number | undefined {
  const r = embed.aspectRatio;
  return r !== undefined && Number.isFinite(r) && r >= 0.5 && r <= 4 ? r : undefined;
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
