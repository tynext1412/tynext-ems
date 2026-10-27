import { createContext, useContext, type ReactNode } from "react";
import type { AuthRepository } from "./auth-repository";

const AuthRepositoryContext = createContext<AuthRepository | null>(null);

export function AuthRepositoryProvider({ repository, children }: { repository: AuthRepository; children: ReactNode }) {
  return <AuthRepositoryContext.Provider value={repository}>{children}</AuthRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthRepository(): AuthRepository {
  const repo = useContext(AuthRepositoryContext);
  if (!repo) throw new Error("AuthRepositoryProvider belum dipasang di composition root");
  return repo;
}
