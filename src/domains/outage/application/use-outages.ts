import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PlantId } from "@/domains/plant/domain/plant";
import { useNow } from "@/shared/lib/useNow";
import { outageBands, type OutageBand } from "../domain/outage";
import { useOutageRepository } from "./outage-repository-context";

export const outageKeys = {
  byPlant: (plantId: PlantId) => ["outages", plantId] as const,
};

// Dipakai banner dan pita grafik (satu query per plant). Last Will masuk 5–9 s setelah putus,
// jadi banner muncul ±20 s setelah internet putus.
export function useOutages(plantId: PlantId) {
  const repository = useOutageRepository();
  return useQuery({
    queryKey: outageKeys.byPlant(plantId),
    queryFn: () => repository.findByPlant(plantId),
    enabled: plantId !== "",
    refetchInterval: 10_000,
  });
}

// Pita outage untuk grafik harian tanggal `dateKey`; pita yang masih berjalan ikut memanjang sampai sekarang.
export function useOutageBands(plantId: PlantId, dateKey: string, timeZone: string): OutageBand[] {
  const { data } = useOutages(plantId);
  const now = useNow(15_000);
  return useMemo(() => (data ? outageBands(data, dateKey, timeZone, now) : []), [data, dateKey, timeZone, now]);
}
