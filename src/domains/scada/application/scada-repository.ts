import type { PlantId } from "@/domains/plant/domain/plant";
import type { ScadaEmbed } from "../domain/scada-embed";

export interface ScadaRepository {
  // null = plant ini belum punya viewer SCADA yang dikonfigurasi.
  embedFor(plantId: PlantId): Promise<ScadaEmbed | null>;
}
