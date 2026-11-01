import type { Plant, PlantId, WeatherReport } from "../domain/plant";
import type { PlantInfoUpdate } from "../domain/plant-info";

// Port: diimplementasikan infrastructure (mock sekarang, HTTP nanti).
export interface PlantRepository {
  findAll(): Promise<Plant[]>;
  findById(id: PlantId): Promise<Plant | null>;
  weatherReport(id: PlantId): Promise<WeatherReport | null>;
  // Ubah data dasar, lokasi, dan kontak dari halaman Information.
  updateInfo(id: PlantId, info: PlantInfoUpdate): Promise<Plant>;
}
