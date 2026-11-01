import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlantId } from "@/domains/plant/domain/plant";
import type { EnergySeriesGranularity, OperatingDataQuery } from "../domain/performance";
import type { PurchaseTariff } from "../domain/tariff";
import { usePerformanceRepository } from "./performance-repository-context";

export const performanceKeys = {
  all: ["performances"] as const,
  operating: (q: OperatingDataQuery) => ["performances", q.plantId, "operating", q.granularity, q.date] as const,
  energy: (plantId: PlantId, granularity: EnergySeriesGranularity, date: string) => ["performances", plantId, "energy", granularity, date] as const,
  tariff: (plantId: PlantId, date: string) => ["performances", plantId, "tariff", date] as const,
  purchaseTariff: (plantId: PlantId) => ["performances", plantId, "purchase-tariff"] as const,
};

export function usePerformances() {
  const repository = usePerformanceRepository();
  return useQuery({
    queryKey: performanceKeys.all,
    queryFn: () => repository.findAll(),
  });
}

export function useOperatingData(query: OperatingDataQuery) {
  const repository = usePerformanceRepository();
  return useQuery({
    queryKey: performanceKeys.operating(query),
    queryFn: () => repository.operatingData(query),
    enabled: query.plantId !== "",
    placeholderData: keepPreviousData, // ganti tanggal/periode tanpa kedip ke skeleton
  });
}

export function useEnergySeries(plantId: PlantId, granularity: EnergySeriesGranularity, date: string) {
  const repository = usePerformanceRepository();
  return useQuery({
    queryKey: performanceKeys.energy(plantId, granularity, date),
    queryFn: () => repository.energySeries(plantId, granularity, date),
    enabled: plantId !== "",
    placeholderData: keepPreviousData,
  });
}

export function useTariffSeries(plantId: PlantId, date: string) {
  const repository = usePerformanceRepository();
  return useQuery({
    queryKey: performanceKeys.tariff(plantId, date),
    queryFn: () => repository.tariffSeries(plantId, date),
    enabled: plantId !== "",
    placeholderData: keepPreviousData,
    staleTime: 10 * 60_000,
  });
}

export function usePurchaseTariff(plantId: PlantId) {
  const repository = usePerformanceRepository();
  return useQuery({
    queryKey: performanceKeys.purchaseTariff(plantId),
    queryFn: () => repository.purchaseTariff(plantId),
    enabled: plantId !== "",
  });
}

// Setelah disimpan, semua query performa di-refresh: tarif per jam (grafik SOC & Tariff) dan
// tarif dasar di read model lifetime ikut berubah.
export function useUpdatePurchaseTariff(plantId: PlantId) {
  const repository = usePerformanceRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tariff: PurchaseTariff) => repository.updatePurchaseTariff(plantId, tariff),
    onSuccess: (saved) => {
      queryClient.setQueryData(performanceKeys.purchaseTariff(plantId), saved);
      return queryClient.invalidateQueries({ queryKey: performanceKeys.all });
    },
  });
}
