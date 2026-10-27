import { createContext, useContext, type ReactNode } from "react";
import type { ScadaRepository } from "./scada-repository";

const ScadaRepositoryContext = createContext<ScadaRepository | null>(null);

export function ScadaRepositoryProvider({ repository, children }: { repository: ScadaRepository; children: ReactNode }) {
  return <ScadaRepositoryContext.Provider value={repository}>{children}</ScadaRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useScadaRepository(): ScadaRepository {
  const repo = useContext(ScadaRepositoryContext);
  if (!repo) throw new Error("ScadaRepositoryProvider belum dipasang di composition root");
  return repo;
}
