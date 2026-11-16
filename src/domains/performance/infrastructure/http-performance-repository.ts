import type { PlantId } from "@/domains/plant/domain/plant";
import { isApiError, type ApiClient } from "@/shared/lib/apiClient";
import { enc, query } from "@/shared/lib/http";
import type { PerformanceRepository } from "../application/performance-repository";
import type { EnergyBucket, EnergySeriesGranularity, OperatingData, OperatingDataQuery, PlantPerformance, TariffPoint } from "../domain/performance";
import type { PurchaseTariff } from "../domain/tariff";

// Plant yang belum punya jadwal tarif beli: backend menjawab 404; form Edit tetap bisa dibuka
// dan validasi meminta tarif > 0 sebelum disimpan.
export const UNSET_PURCHASE_TARIFF: PurchaseTariff = { mode: "FLAT", baseRateIDRPerKWh: 0, bands: [] };

export class HttpPerformanceRepository implements PerformanceRepository {
  constructor(private readonly api: ApiClient) {}

  findAll(): Promise<PlantPerformance[]> {
    return this.api.get<PlantPerformance[]>("/performances");
  }

  operatingData(q: OperatingDataQuery): Promise<OperatingData> {
    return this.api.get<OperatingData>(`/plants/${enc(q.plantId)}/operating-data${query({ granularity: q.granularity, date: q.date })}`);
  }

  energySeries(plantId: PlantId, granularity: EnergySeriesGranularity, date: string): Promise<EnergyBucket[]> {
    return this.api.get<EnergyBucket[]>(`/plants/${enc(plantId)}/energy-series${query({ granularity, date })}`);
  }

  tariffSeries(plantId: PlantId, date: string): Promise<TariffPoint[]> {
    return this.api.get<TariffPoint[]>(`/plants/${enc(plantId)}/tariff-series${query({ date })}`);
  }

  async purchaseTariff(plantId: PlantId): Promise<PurchaseTariff> {
    try {
      return await this.api.get<PurchaseTariff>(`/plants/${enc(plantId)}/purchase-tariff`);
    } catch (e) {
      if (isApiError(e) && e.status === 404 && e.code === "NOT_FOUND") return structuredClone(UNSET_PURCHASE_TARIFF);
      throw e;
    }
  }

  updatePurchaseTariff(plantId: PlantId, tariff: PurchaseTariff): Promise<PurchaseTariff> {
    const body: PurchaseTariff = { mode: tariff.mode, baseRateIDRPerKWh: tariff.baseRateIDRPerKWh, bands: tariff.mode === "FLAT" ? [] : tariff.bands };
    return this.api.put<PurchaseTariff>(`/plants/${enc(plantId)}/purchase-tariff`, body);
  }
}
