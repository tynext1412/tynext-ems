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

// Dashboard adalah read side: hanya menjumlahkan read model context lain.
export function buildOverview(plants: readonly Plant[], performances: readonly PlantPerformance[]): DashboardOverview {
  const totals = sumPerformance(performances);

  return {
    summary: {
      totalSites: plants.length,
      activeSites: plants.filter((p) => isActive(p.status)).length,
      pvCapacityKWp: plants.reduce((sum, p) => sum + p.capacity.pvKWp, 0),
      bessCapacityKWh: plants.reduce((sum, p) => sum + p.capacity.batteryKWh, 0),
      generationKWh: totals.generationKWh,
      revenueIDR: totals.revenueIDR,
    },
    bess: {
      chargeKWh: totals.chargeKWh,
      dischargeKWh: totals.dischargeKWh,
    },
    statusCount: countByStatus(plants),
  };
}
