import { createContext, useContext, type ReactNode } from "react";
import type { PlantRepository } from "./plant-repository";

const PlantRepositoryContext = createContext<PlantRepository | null>(null);

export function PlantRepositoryProvider({ repository, children }: { repository: PlantRepository; children: ReactNode }) {
  return <PlantRepositoryContext.Provider value={repository}>{children}</PlantRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function usePlantRepository(): PlantRepository {
  const repo = useContext(PlantRepositoryContext);
  if (!repo) throw new Error("PlantRepositoryProvider is not mounted in the composition root");
  return repo;
}
