import { createContext, useContext, type ReactNode } from "react";
import type { PerformanceRepository } from "./performance-repository";

const PerformanceRepositoryContext = createContext<PerformanceRepository | null>(null);

export function PerformanceRepositoryProvider({
  repository,
  children,
}: {
  repository: PerformanceRepository;
  children: ReactNode;
}) {
  return <PerformanceRepositoryContext.Provider value={repository}>{children}</PerformanceRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function usePerformanceRepository(): PerformanceRepository {
  const repo = useContext(PerformanceRepositoryContext);
  if (!repo) throw new Error("PerformanceRepositoryProvider is not mounted in the composition root");
  return repo;
}
