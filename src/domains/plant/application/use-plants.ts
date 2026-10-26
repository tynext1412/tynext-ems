import { useQuery } from "@tanstack/react-query";
import type { PlantId } from "../domain/plant";
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
