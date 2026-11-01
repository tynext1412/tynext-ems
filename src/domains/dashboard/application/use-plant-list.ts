import { useCallback, useMemo, useState } from "react";
import { usePerformances } from "@/domains/performance/application/use-performances";
import { usePlants } from "@/domains/plant/application/use-plants";
import { applyPlantListQuery, buildPlantRows, DEFAULT_PLANT_LIST_QUERY, type PlantListQuery, type SortKey } from "../domain/plant-list";

export function usePlantList() {
  const plantsQuery = usePlants();
  const performancesQuery = usePerformances();
  const [query, setQuery] = useState<PlantListQuery>(DEFAULT_PLANT_LIST_QUERY);
  const [searching, setSearching] = useState(false);

  const rows = useMemo(() => buildPlantRows(plantsQuery.data ?? [], performancesQuery.data ?? []), [plantsQuery.data, performancesQuery.data]);
  const page = useMemo(() => applyPlantListQuery(rows, query), [rows, query]);

  // Setiap perubahan filter kembali ke halaman 1; hanya pindah halaman yang tidak.
  const update = useCallback((patch: Partial<PlantListQuery>) => {
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  // Pencarian memuat ulang daftar dari server supaya hasilnya segar; selama itu tabel menampilkan skeleton.
  const search = useCallback(
    async (term: string) => {
      setQuery((prev) => ({ ...prev, search: term, page: 1 }));
      setSearching(true);
      try {
        await plantsQuery.refetch();
      } finally {
        setSearching(false);
      }
    },
    [plantsQuery],
  );

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
    search,
    searching,
    toggleSort,
    reset,
    retry,
    isPending: plantsQuery.isPending,
    isRefetching: plantsQuery.isFetching && !plantsQuery.isPending,
    performancePending: performancesQuery.isPending,
    error: plantsQuery.error,
    performanceError: performancesQuery.error,
  };
}
