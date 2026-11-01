import { useMemo } from "react";
import { calculateImpact, DEFAULT_EMISSION_FACTORS } from "@/domains/impact/domain/impact";
import { usePerformances } from "@/domains/performance/application/use-performances";
import { usePlants } from "@/domains/plant/application/use-plants";
import { buildPerformanceSummary, buildPlantSummary } from "../domain/overview";

export interface WidgetState {
  isPending: boolean;
  error: Error | null;
  retry: () => void;
}

// Dua sumber data terpisah supaya tiap widget memuat dan gagal sendiri-sendiri (PRD):
// kartu Total Sites/PV/BESS dan tab status dari daftar plant; Energy/Revenue, BESS performance,
// dan Environmental Benefits dari read model performa.
export function useDashboardOverview() {
  const plantsQuery = usePlants();
  const performancesQuery = usePerformances();

  const plantSummary = useMemo(() => (plantsQuery.data ? buildPlantSummary(plantsQuery.data) : undefined), [plantsQuery.data]);
  const performanceSummary = useMemo(() => (performancesQuery.data ? buildPerformanceSummary(performancesQuery.data) : undefined), [performancesQuery.data]);
  const impact = useMemo(() => (performanceSummary ? calculateImpact(performanceSummary.generationKWh, DEFAULT_EMISSION_FACTORS) : undefined), [performanceSummary]);

  const plantsState: WidgetState = {
    isPending: plantsQuery.isPending,
    error: plantsQuery.error,
    retry: () => void plantsQuery.refetch(),
  };
  const performancesState: WidgetState = {
    isPending: performancesQuery.isPending,
    error: performancesQuery.error,
    retry: () => void performancesQuery.refetch(),
  };

  return { plants: plantsQuery.data ?? [], plantSummary, performanceSummary, impact, plantsState, performancesState };
}
