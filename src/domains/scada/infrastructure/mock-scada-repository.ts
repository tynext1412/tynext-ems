import type { PlantId } from "@/domains/plant/domain/plant";
import type { ScadaRepository } from "../application/scada-repository";
import type { ScadaEmbed } from "../domain/scada-embed";

// Konfigurasi embed dummy. Hanya PLT-001 yang menunjuk ke halaman placeholder lokal
// (bukan SCADA sungguhan) untuk membuktikan jalur embed; plant lain belum dikonfigurasi.
const EMBED_BY_PLANT: Record<string, ScadaEmbed> = {
  "PLT-001": {
    provider: "Placeholder (bukan SCADA)",
    url: "/scada-placeholder.html?plant={plantId}",
    allowFullscreen: true,
  },
};

export class MockScadaRepository implements ScadaRepository {
  // urlTemplate dari VITE_SCADA_URL_TEMPLATE berlaku untuk semua plant bila diisi,
  // mis. https://scada.example.com/view/{plantId}?theme=dark
  constructor(
    private readonly urlTemplate?: string,
    private readonly provider = "SCADA viewer",
  ) {}

  async embedFor(plantId: PlantId): Promise<ScadaEmbed | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (this.urlTemplate) return { provider: this.provider, url: this.urlTemplate, allowFullscreen: true };
    return EMBED_BY_PLANT[plantId] ?? null;
  }
}
