import { createContext, useContext, type ReactNode } from "react";
import type { MaintenanceRepository } from "./maintenance-repository";

const MaintenanceRepositoryContext = createContext<MaintenanceRepository | null>(null);

export function MaintenanceRepositoryProvider({ repository, children }: { repository: MaintenanceRepository; children: ReactNode }) {
  return <MaintenanceRepositoryContext.Provider value={repository}>{children}</MaintenanceRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useMaintenanceRepository(): MaintenanceRepository {
  const repo = useContext(MaintenanceRepositoryContext);
  if (!repo) throw new Error("MaintenanceRepositoryProvider belum dipasang di composition root");
  return repo;
}
