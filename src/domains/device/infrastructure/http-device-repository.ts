import type { PlantId } from "@/domains/plant/domain/plant";
import type { EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import type { ApiClient } from "@/shared/lib/apiClient";
import { enc, orNull, query, resolveApiUrl } from "@/shared/lib/http";
import type { DeviceRepository, DeviceTelemetryRepository } from "../application/device-repository";
import type { DeviceRecord } from "../domain/device";
import type { DeviceEnergyBucket, DeviceReading, DeviceSample } from "../domain/reading";

export class HttpDeviceRepository implements DeviceRepository {
  constructor(private readonly api: ApiClient) {}

  async findByPlant(plantId: PlantId): Promise<DeviceRecord[]> {
    const items = await this.api.get<DeviceRecord[]>(`/plants/${enc(plantId)}/devices`);
    return items.map((d) => this.withPhoto(d));
  }

  async findById(deviceId: string): Promise<DeviceRecord | null> {
    const d = await orNull(this.api.get<DeviceRecord>(`/devices/${enc(deviceId)}`));
    return d ? this.withPhoto(d) : null;
  }

  private withPhoto(d: DeviceRecord): DeviceRecord {
    return d.photoUrl ? { ...d, photoUrl: resolveApiUrl(d.photoUrl, this.api.baseUrl) } : d;
  }
}

export class HttpDeviceTelemetryRepository implements DeviceTelemetryRepository {
  constructor(private readonly api: ApiClient) {}

  // Map deviceId → pembacaan; perangkat yang belum pernah melapor tidak ada di map.
  latestForPlant(plantId: PlantId): Promise<Record<string, DeviceReading>> {
    return this.api.get<Record<string, DeviceReading>>(`/plants/${enc(plantId)}/devices/readings`);
  }

  latest(deviceId: string): Promise<DeviceReading | null> {
    return orNull(this.api.get<DeviceReading | null>(`/devices/${enc(deviceId)}/reading`));
  }

  dailySeries(deviceId: string, date: string): Promise<DeviceSample[]> {
    return this.api.get<DeviceSample[]>(`/devices/${enc(deviceId)}/series/daily${query({ date })}`);
  }

  energySeries(deviceId: string, granularity: EnergySeriesGranularity, date: string): Promise<DeviceEnergyBucket[]> {
    return this.api.get<DeviceEnergyBucket[]>(`/devices/${enc(deviceId)}/series/energy${query({ granularity, date })}`);
  }
}
