import type { PlantId } from "@/domains/plant/domain/plant";
import type { Outage } from "../domain/outage";

export interface OutageRepository {
  // Outage controller plant ini, 30 hari terakhir, terbaru dulu.
  findByPlant(plantId: PlantId): Promise<Outage[]>;
}
