import { useQuery } from "@tanstack/react-query";
import type { PlantId } from "@/domains/plant/domain/plant";
import { useAlarmRepository } from "./alarm-repository-context";

export const alarmKeys = {
  byPlant: (plantId: PlantId) => ["alarms", plantId] as const,
};

export function useAlarms(plantId: PlantId) {
  const repository = useAlarmRepository();
  return useQuery({
    queryKey: alarmKeys.byPlant(plantId),
    queryFn: () => repository.findByPlant(plantId),
    enabled: plantId !== "",
    refetchInterval: 30_000,
  });
}
