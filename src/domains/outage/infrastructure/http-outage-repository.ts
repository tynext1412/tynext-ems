import type { PlantId } from "@/domains/plant/domain/plant";
import type { ApiClient } from "@/shared/lib/apiClient";
import { query } from "@/shared/lib/http";
import type { OutageRepository } from "../application/outage-repository";
import type { Outage } from "../domain/outage";

export class HttpOutageRepository implements OutageRepository {
  constructor(private readonly api: ApiClient) {}

  // GET /outages?plantId= (default 30 hari terakhir, terbaru dulu). Field opsional yang kosong tidak dibawa.
  async findByPlant(plantId: PlantId): Promise<Outage[]> {
    const items = await this.api.get<Outage[]>(`/outages${query({ plantId })}`);
    return items.map(({ id, plantId: pid, deviceId, offlineAt, lastTsBefore, onlineAt, firstTsAfter, cause }) => ({
      id,
      plantId: pid,
      deviceId,
      offlineAt,
      cause,
      ...(lastTsBefore ? { lastTsBefore } : {}),
      ...(onlineAt ? { onlineAt } : {}),
      ...(firstTsAfter ? { firstTsAfter } : {}),
    }));
  }
}
