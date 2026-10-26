import type { PlantId } from "@/domains/plant/domain/plant";
import type { Alarm } from "../domain/alarm";

export interface AlarmRepository {
  findByPlant(plantId: PlantId): Promise<Alarm[]>;
}
