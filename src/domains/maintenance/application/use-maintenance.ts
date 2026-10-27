import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlantId } from "@/domains/plant/domain/plant";
import type { MaintenanceDraft } from "../domain/maintenance";
import type { MaintenanceUpdate } from "./maintenance-repository";
import { useMaintenanceRepository } from "./maintenance-repository-context";

export const maintenanceKeys = {
  byPlant: (plantId: PlantId) => ["maintenance", plantId] as const,
};

export function useMaintenance(plantId: PlantId) {
  const repo = useMaintenanceRepository();
  return useQuery({ queryKey: maintenanceKeys.byPlant(plantId), queryFn: () => repo.findByPlant(plantId), enabled: plantId !== "" });
}

export function useCreateMaintenance(plantId: PlantId) {
  const repo = useMaintenanceRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: MaintenanceDraft) => repo.create(plantId, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.byPlant(plantId) }),
  });
}

export function useUpdateMaintenance(plantId: PlantId) {
  const repo = useMaintenanceRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: MaintenanceUpdate }) => repo.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.byPlant(plantId) }),
  });
}
