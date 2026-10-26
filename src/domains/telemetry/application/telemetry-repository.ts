import type { PlantId } from "@/domains/plant/domain/plant";
import type { PowerSample, PowerSnapshot } from "../domain/power-snapshot";

export interface TelemetryRepository {
  latest(plantId: PlantId): Promise<PowerSnapshot | null>;
  // Deret daya per 5 menit untuk satu tanggal lokal plant (YYYY-MM-DD).
  dailySeries(plantId: PlantId, date: string): Promise<PowerSample[]>;
}
