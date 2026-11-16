import type { PlantId } from "@/domains/plant/domain/plant";
import type { PowerSample, PowerSnapshot } from "../domain/power-snapshot";

export interface TelemetryRepository {
  latest(plantId: PlantId): Promise<PowerSnapshot | null>;
  // Deret daya untuk satu tanggal lokal plant (YYYY-MM-DD): per 1 menit hari ini, per 5 menit hari lain.
  dailySeries(plantId: PlantId, date: string): Promise<PowerSample[]>;
}
