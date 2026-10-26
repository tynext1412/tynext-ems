import { createContext, useContext, type ReactNode } from "react";
import type { AlarmRepository } from "./alarm-repository";

const AlarmRepositoryContext = createContext<AlarmRepository | null>(null);

export function AlarmRepositoryProvider({ repository, children }: { repository: AlarmRepository; children: ReactNode }) {
  return <AlarmRepositoryContext.Provider value={repository}>{children}</AlarmRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useAlarmRepository(): AlarmRepository {
  const repo = useContext(AlarmRepositoryContext);
  if (!repo) throw new Error("AlarmRepositoryProvider belum dipasang di composition root");
  return repo;
}
