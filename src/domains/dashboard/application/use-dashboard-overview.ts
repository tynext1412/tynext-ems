import { useCallback, useMemo } from "react";
import { calculateImpact, DEFAULT_EMISSION_FACTORS } from "@/domains/impact/domain/impact";
import { usePerformances } from "@/domains/performance/application/use-performances";
import { usePlants } from "@/domains/plant/application/use-plants";
import { buildOverview } from "../domain/overview";

export function useDashboardOverview() {
  const plantsQuery = usePlants();
  const performancesQuery = usePerformances();

  const overview = useMemo(() => {
    if (!plantsQuery.data || !performancesQuery.data) return undefined;
    return buildOverview(plantsQuery.data, performancesQuery.data);
  }, [plantsQuery.data, performancesQuery.data]);

  const impact = useMemo(
    () => (overview ? calculateImpact(overview.summary.generationKWh, DEFAULT_EMISSION_FACTORS) : undefined),
    [overview],
  );

  const retry = useCallback(() => {
    void plantsQuery.refetch();
    void performancesQuery.refetch();
  }, [plantsQuery, performancesQuery]);

  return {
    plants: plantsQuery.data ?? [],
    overview,
    impact,
    retry,
    isPending: plantsQuery.isPending || performancesQuery.isPending,
    error: plantsQuery.error ?? performancesQuery.error,
  };
}
