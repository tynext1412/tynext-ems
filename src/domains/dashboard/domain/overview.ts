import type { Plant } from "@/domains/plant/domain/plant";
import { countByStatus, isActive, type StatusCount } from "@/domains/plant/domain/status-policy";
import { sumPerformance, type PlantPerformance } from "@/domains/performance/domain/performance";
import type { IDR, KWh, KWp } from "@/shared/domain/units";

export interface DashboardSummary {
  totalSites: number;
  activeSites: number; // plant yang tidak OFFLINE
  pvCapacityKWp: KWp;
  bessCapacityKWh: KWh;
  generationKWh: KWh;
  revenueIDR: IDR;
}

export interface BessPerformance {
  chargeKWh: KWh;
  dischargeKWh: KWh;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  bess: BessPerformance;
  statusCount: StatusCount;
}

// Bagian ringkasan yang hanya butuh daftar plant (kartu Total Sites, PV, BESS, tab status).
export interface PlantSummary {
  totalSites: number;
  activeSites: number;
  pvCapacityKWp: KWp;
  bessCapacityKWh: KWh;
  statusCount: StatusCount;
}

// Bagian ringkasan yang butuh read model performa (Energy Generation, Revenue, charge/discharge).
export interface PerformanceSummary {
  generationKWh: KWh;
  revenueIDR: IDR;
  bess: BessPerformance;
}

export function buildPlantSummary(plants: readonly Plant[]): PlantSummary {
  return {
    totalSites: plants.length,
    activeSites: plants.filter((p) => isActive(p.status)).length,
    pvCapacityKWp: plants.reduce((sum, p) => sum + p.capacity.pvKWp, 0),
    bessCapacityKWh: plants.reduce((sum, p) => sum + p.capacity.batteryKWh, 0),
    statusCount: countByStatus(plants),
  };
}

export function buildPerformanceSummary(performances: readonly PlantPerformance[]): PerformanceSummary {
  const totals = sumPerformance(performances);
  return {
    generationKWh: totals.generationKWh,
    revenueIDR: totals.revenueIDR,
    bess: { chargeKWh: totals.chargeKWh, dischargeKWh: totals.dischargeKWh },
  };
}

// Efisiensi round-trip BESS: energi keluar dibanding energi masuk (0–1).
export function roundTripEfficiency(bess: BessPerformance): number {
  return bess.chargeKWh > 0 ? Math.min(1, bess.dischargeKWh / bess.chargeKWh) : 0;
}

// Dashboard adalah read side: hanya menjumlahkan read model context lain. Kedua bagian
// dipisah supaya kartu yang datanya gagal tidak menyeret kartu lain.
export function buildOverview(plants: readonly Plant[], performances: readonly PlantPerformance[]): DashboardOverview {
  const plantSummary = buildPlantSummary(plants);
  const performanceSummary = buildPerformanceSummary(performances);
  return {
    summary: {
      totalSites: plantSummary.totalSites,
      activeSites: plantSummary.activeSites,
      pvCapacityKWp: plantSummary.pvCapacityKWp,
      bessCapacityKWh: plantSummary.bessCapacityKWh,
      generationKWh: performanceSummary.generationKWh,
      revenueIDR: performanceSummary.revenueIDR,
    },
    bess: performanceSummary.bess,
    statusCount: plantSummary.statusCount,
  };
}
