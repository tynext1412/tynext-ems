import type { PlantId } from "@/domains/plant/domain/plant";
import type { EnergyBucket, EnergySeriesGranularity, OperatingData, OperatingDataQuery, PlantPerformance, TariffPoint } from "../domain/performance";
import type { PurchaseTariff } from "../domain/tariff";

export interface PerformanceRepository {
  findAll(): Promise<PlantPerformance[]>;
  operatingData(query: OperatingDataQuery): Promise<OperatingData>;
  // Batang energi dalam periode: Month → per hari, Year → per bulan, Lifetime → per tahun.
  energySeries(plantId: PlantId, granularity: EnergySeriesGranularity, date: string): Promise<EnergyBucket[]>;
  // Tarif per jam untuk satu tanggal lokal plant.
  tariffSeries(plantId: PlantId, date: string): Promise<TariffPoint[]>;
  // Skema tarif beli (flat 24 jam atau per periode jam) yang dikelola di Tariff Management.
  purchaseTariff(plantId: PlantId): Promise<PurchaseTariff>;
  updatePurchaseTariff(plantId: PlantId, tariff: PurchaseTariff): Promise<PurchaseTariff>;
}
