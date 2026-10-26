import { useCallback, useMemo, useState } from "react";
import { usePerformances } from "@/domains/performance/application/use-performances";
import { usePlants } from "@/domains/plant/application/use-plants";
import { applyPlantListQuery, buildPlantRows, DEFAULT_PLANT_LIST_QUERY, type PlantListQuery, type SortKey } from "../domain/plant-list";

export function usePlantList() {
  const plantsQuery = usePlants();
  const performancesQuery = usePerformances();
  const [query, setQuery] = useState<PlantListQuery>(DEFAULT_PLANT_LIST_QUERY);

  const rows = useMemo(
    () => buildPlantRows(plantsQuery.data ?? [], performancesQuery.data ?? []),
    [plantsQuery.data, performancesQuery.data],
  );
  const page = useMemo(() => applyPlantListQuery(rows, query), [rows, query]);

  // Setiap perubahan filter kembali ke halaman 1; hanya pindah halaman yang tidak.
  const update = useCallback((patch: Partial<PlantListQuery>) => {
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    setQuery((prev) => ({
      ...prev,
      sortBy: key,
      order: prev.sortBy === key && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const reset = useCallback(() => setQuery(DEFAULT_PLANT_LIST_QUERY), []);

  const retry = useCallback(() => {
    void plantsQuery.refetch();
    void performancesQuery.refetch();
  }, [plantsQuery, performancesQuery]);

  return {
    query,
    page,
    update,
    toggleSort,
    reset,
    retry,
    isPending: plantsQuery.isPending || performancesQuery.isPending,
    error: plantsQuery.error ?? performancesQuery.error,
  };
}
