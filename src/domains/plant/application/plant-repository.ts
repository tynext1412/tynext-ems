import type { Plant, PlantId, WeatherReport } from "../domain/plant";

// Port: diimplementasikan infrastructure (mock sekarang, HTTP nanti).
export interface PlantRepository {
  findAll(): Promise<Plant[]>;
  findById(id: PlantId): Promise<Plant | null>;
  weatherReport(id: PlantId): Promise<WeatherReport | null>;
}
