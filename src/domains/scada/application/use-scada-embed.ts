import { useQuery } from "@tanstack/react-query";
import type { PlantId } from "@/domains/plant/domain/plant";
import { useScadaRepository } from "./scada-repository-context";

export const scadaKeys = {
  embed: (plantId: PlantId) => ["scada", plantId, "embed"] as const,
};

export function useScadaEmbed(plantId: PlantId) {
  const repository = useScadaRepository();
  return useQuery({
    queryKey: scadaKeys.embed(plantId),
    queryFn: () => repository.embedFor(plantId),
    enabled: plantId !== "",
    staleTime: Infinity, // konfigurasi, bukan telemetri
  });
}
