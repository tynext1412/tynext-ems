import { createContext, useContext, type ReactNode } from "react";
import type { OutageRepository } from "./outage-repository";

const OutageRepositoryContext = createContext<OutageRepository | null>(null);

export function OutageRepositoryProvider({ repository, children }: { repository: OutageRepository; children: ReactNode }) {
  return <OutageRepositoryContext.Provider value={repository}>{children}</OutageRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useOutageRepository(): OutageRepository {
  const repo = useContext(OutageRepositoryContext);
  if (!repo) throw new Error("OutageRepositoryProvider is not mounted in the composition root");
  return repo;
}
