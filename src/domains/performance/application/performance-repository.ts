import type { PlantId } from "@/domains/plant/domain/plant";
import type { EnergyBucket, EnergySeriesGranularity, OperatingData, OperatingDataQuery, PlantPerformance, TariffPoint } from "../domain/performance";

export interface PerformanceRepository {
  findAll(): Promise<PlantPerformance[]>;
  operatingData(query: OperatingDataQuery): Promise<OperatingData>;
  // Batang energi dalam periode: Month → per hari, Year → per bulan, Lifetime → per tahun.
  energySeries(plantId: PlantId, granularity: EnergySeriesGranularity, date: string): Promise<EnergyBucket[]>;
  // Tarif per jam untuk satu tanggal lokal plant.
  tariffSeries(plantId: PlantId, date: string): Promise<TariffPoint[]>;
}
