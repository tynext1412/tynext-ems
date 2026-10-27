import type { Credentials, Session } from "../domain/auth";

export type SsoProvider = "google" | "microsoft";

export interface AuthRepository {
  current(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signInWithProvider(provider: SsoProvider): Promise<Session>;
  signOut(): Promise<void>;
}
