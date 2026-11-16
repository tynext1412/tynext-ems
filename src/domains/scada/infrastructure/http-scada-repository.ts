import type { PlantId } from "@/domains/plant/domain/plant";
import type { ApiClient } from "@/shared/lib/apiClient";
import { enc } from "@/shared/lib/http";
import type { ScadaRepository } from "../application/scada-repository";
import type { ScadaEmbed } from "../domain/scada-embed";

export class HttpScadaRepository implements ScadaRepository {
  // urlTemplate (VITE_SCADA_URL_TEMPLATE) dipakai bila backend belum mengonfigurasi viewer plant itu.
  constructor(
    private readonly api: ApiClient,
    private readonly urlTemplate?: string,
    private readonly provider = "SCADA viewer",
  ) {}

  async embedFor(plantId: PlantId): Promise<ScadaEmbed | null> {
    const embed = await this.api.get<ScadaEmbed | null>(`/plants/${enc(plantId)}/scada-embed`);
    if (embed) return embed;
    return this.urlTemplate ? { provider: this.provider, url: this.urlTemplate, allowFullscreen: true } : null;
  }
}
