import type { PlantId } from "@/domains/plant/domain/plant";
import type { ApiClient } from "@/shared/lib/apiClient";
import { enc } from "@/shared/lib/http";
import type { AlarmRepository } from "../application/alarm-repository";
import type { Alarm } from "../domain/alarm";

// Bentuk kontrak: Alarm + deviceType (belum dipakai domain; tipe diturunkan dari deviceId).
interface AlarmDto extends Alarm {
  deviceType?: string;
}

export class HttpAlarmRepository implements AlarmRepository {
  constructor(private readonly api: ApiClient) {}

  // Semua alarm aktif + yang pulih 30 hari terakhir.
  async findByPlant(plantId: PlantId): Promise<Alarm[]> {
    const items = await this.api.get<AlarmDto[]>(`/plants/${enc(plantId)}/alarms`);
    return items.map(({ id, plantId: pid, deviceId, code, severity, message, raisedAt, clearedAt }) => ({
      id,
      plantId: pid,
      deviceId,
      code,
      severity,
      message,
      raisedAt,
      ...(clearedAt ? { clearedAt } : {}),
    }));
  }
}
