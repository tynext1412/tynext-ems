import type { PlantId } from "@/domains/plant/domain/plant";
import type { IDR, KWh } from "@/shared/domain/units";

// Read model kinerja satu plant (lifetime). Angka ini dihitung backend dari
// telemetri; frontend hanya menjumlahkan dan menampilkan.
export interface PlantPerformance {
  plantId: PlantId;
  generationKWh: KWh;
  chargeKWh: KWh;
  dischargeKWh: KWh;
  tariffIDRPerKWh: IDR; // tarif jual (feed-in / PPA), dasar revenue
  purchaseTariffIDRPerKWh: IDR; // tarif beli dari grid (LWBP)
  revenueIDR: IDR;
}

export interface PerformanceTotals {
  generationKWh: KWh;
  chargeKWh: KWh;
  dischargeKWh: KWh;
  revenueIDR: IDR;
}

export const EMPTY_PERFORMANCE: Omit<PlantPerformance, "plantId"> = {
  generationKWh: 0,
  chargeKWh: 0,
  dischargeKWh: 0,
  tariffIDRPerKWh: 0,
  purchaseTariffIDRPerKWh: 0,
  revenueIDR: 0,
};

export function sumPerformance(items: readonly PlantPerformance[]): PerformanceTotals {
  return items.reduce<PerformanceTotals>(
    (acc, p) => ({
      generationKWh: acc.generationKWh + p.generationKWh,
      chargeKWh: acc.chargeKWh + p.chargeKWh,
      dischargeKWh: acc.dischargeKWh + p.dischargeKWh,
      revenueIDR: acc.revenueIDR + p.revenueIDR,
    }),
    { generationKWh: 0, chargeKWh: 0, dischargeKWh: 0, revenueIDR: 0 },
  );
}

export function indexByPlant(items: readonly PlantPerformance[]): Map<PlantId, PlantPerformance> {
  return new Map(items.map((p) => [p.plantId, p]));
}

// ── Operating data per periode (panel "Operating Data" di halaman site) ──────

export type Granularity = "day" | "month" | "year" | "lifetime";

export const GRANULARITIES: readonly Granularity[] = ["day", "month", "year", "lifetime"];

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Day",
  month: "Month",
  year: "Year",
  lifetime: "Lifetime",
};

export interface Period {
  granularity: Granularity;
  date: string; // YYYY-MM-DD, tanggal lokal plant yang dijadikan acuan periode
}

export interface OperatingDataQuery extends Period {
  plantId: PlantId;
}

// Field mengikuti spesifikasi "Operating Data".
export interface OperatingData {
  pvProductionKWh: KWh;
  bessChargeKWh: KWh;
  bessDischargeKWh: KWh;
  dieselGeneratorKWh: KWh;
  loadConsumptionKWh: KWh;
  dayOperation: number; // hari plant beroperasi dalam periode
  hoursOperation: number; // jam PV menghasilkan daya dalam periode
  revenueIDR: IDR;
}

// Satu batang chart energi: per hari (Month), per bulan (Year), per tahun (Lifetime).
export interface EnergyBucket {
  key: string; // YYYY-MM-DD | YYYY-MM | YYYY
  pvProductionKWh: KWh;
  gridSupplyKWh: KWh; // impor dari grid
  gridExportKWh: KWh; // ekspor (feed-in) ke grid
  chargeKWh: KWh;
  dischargeKWh: KWh;
  generatorSupplyKWh: KWh;
  loadKWh: KWh;
}

export type EnergySeriesGranularity = Exclude<Granularity, "day">;

// Tarif yang berlaku pada jam tertentu: beli dari grid (purchase) dan jual (feed-in).
export interface TariffPoint {
  at: string; // ISO 8601
  purchaseIDRPerKWh: IDR;
  feedInIDRPerKWh: IDR;
}

export function sumEnergyBuckets(buckets: readonly EnergyBucket[]): Omit<EnergyBucket, "key"> {
  return buckets.reduce(
    (acc, b) => ({
      pvProductionKWh: acc.pvProductionKWh + b.pvProductionKWh,
      gridSupplyKWh: acc.gridSupplyKWh + b.gridSupplyKWh,
      gridExportKWh: acc.gridExportKWh + b.gridExportKWh,
      chargeKWh: acc.chargeKWh + b.chargeKWh,
      dischargeKWh: acc.dischargeKWh + b.dischargeKWh,
      generatorSupplyKWh: acc.generatorSupplyKWh + b.generatorSupplyKWh,
      loadKWh: acc.loadKWh + b.loadKWh,
    }),
    { pvProductionKWh: 0, gridSupplyKWh: 0, gridExportKWh: 0, chargeKWh: 0, dischargeKWh: 0, generatorSupplyKWh: 0, loadKWh: 0 },
  );
}
