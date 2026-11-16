import type { ApiClient } from "@/shared/lib/apiClient";
import { enc, orNull } from "@/shared/lib/http";
import type { PlantRepository } from "../application/plant-repository";
import type { Plant, PlantId, WeatherReport } from "../domain/plant";
import type { PlantInfoUpdate } from "../domain/plant-info";

// Adapter HTTP untuk PlantRepository. Status plant dihitung backend dengan aturan yang sama
// dengan status-policy (OFFLINE / ALARM / ONLINE).
export class HttpPlantRepository implements PlantRepository {
  constructor(private readonly api: ApiClient) {}

  findAll(): Promise<Plant[]> {
    return this.api.get<Plant[]>("/plants");
  }

  findById(id: PlantId): Promise<Plant | null> {
    return orNull(this.api.get<Plant>(`/plants/${enc(id)}`));
  }

  // null bila penyedia cuaca belum dikonfigurasi di server.
  weatherReport(id: PlantId): Promise<WeatherReport | null> {
    return orNull(this.api.get<WeatherReport | null>(`/plants/${enc(id)}/weather`));
  }

  updateInfo(id: PlantId, info: PlantInfoUpdate): Promise<Plant> {
    return this.api.patch<Plant>(`/plants/${enc(id)}`, info);
  }
}
