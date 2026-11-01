import { createContext, useContext, type ReactNode } from "react";
import type { TelemetryRepository } from "./telemetry-repository";

const TelemetryRepositoryContext = createContext<TelemetryRepository | null>(null);

export function TelemetryRepositoryProvider({ repository, children }: { repository: TelemetryRepository; children: ReactNode }) {
  return <TelemetryRepositoryContext.Provider value={repository}>{children}</TelemetryRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useTelemetryRepository(): TelemetryRepository {
  const repo = useContext(TelemetryRepositoryContext);
  if (!repo) throw new Error("TelemetryRepositoryProvider is not mounted in the composition root");
  return repo;
}
