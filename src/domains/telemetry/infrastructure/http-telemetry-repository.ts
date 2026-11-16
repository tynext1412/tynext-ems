import type { PlantId } from "@/domains/plant/domain/plant";
import type { ApiClient } from "@/shared/lib/apiClient";
import { enc, query } from "@/shared/lib/http";
import type { TelemetryRepository } from "../application/telemetry-repository";
import type { PowerSample, PowerSnapshot } from "../domain/power-snapshot";

export class HttpTelemetryRepository implements TelemetryRepository {
  constructor(private readonly api: ApiClient) {}

  // null bila plant belum pernah mengirim data.
  latest(plantId: PlantId): Promise<PowerSnapshot | null> {
    return this.api.get<PowerSnapshot | null>(`/plants/${enc(plantId)}/power/latest`);
  }

  dailySeries(plantId: PlantId, date: string): Promise<PowerSample[]> {
    return this.api.get<PowerSample[]>(`/plants/${enc(plantId)}/power/daily${query({ date })}`);
  }
}
