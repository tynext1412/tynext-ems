import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlantId } from "../domain/plant";
import type { PlantInfoUpdate } from "../domain/plant-info";
import { usePlantRepository } from "./plant-repository-context";

export const plantKeys = {
  all: ["plants"] as const,
  detail: (id: PlantId) => ["plants", id] as const,
  weather: (id: PlantId) => ["plants", id, "weather"] as const,
};

export function usePlants() {
  const repository = usePlantRepository();
  return useQuery({
    queryKey: plantKeys.all,
    queryFn: () => repository.findAll(),
  });
}

export function usePlant(id: PlantId) {
  const repository = usePlantRepository();
  return useQuery({
    queryKey: plantKeys.detail(id),
    queryFn: () => repository.findById(id),
    enabled: id !== "",
  });
}

export function useWeatherReport(id: PlantId) {
  const repository = usePlantRepository();
  return useQuery({
    queryKey: plantKeys.weather(id),
    queryFn: () => repository.weatherReport(id),
    enabled: id !== "",
    staleTime: 10 * 60_000,
  });
}

// Setelah disimpan: detail plant diganti hasil server, daftar plant (Home, pemilih site) di-refresh.
export function useUpdatePlantInfo(id: PlantId) {
  const repository = usePlantRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (info: PlantInfoUpdate) => repository.updateInfo(id, info),
    onSuccess: (plant) => {
      queryClient.setQueryData(plantKeys.detail(id), plant);
      return queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
}
