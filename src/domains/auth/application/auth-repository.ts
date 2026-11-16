import type { Credentials, Session } from "../domain/auth";
import type { ResetChallenge, ResetGrant } from "../domain/password-reset";

// Desain hanya menyediakan SSO Google (Microsoft dihapus).
export type SsoProvider = "google";

// Galat dilempar sebagai AuthError (domain/auth.ts) supaya UI bisa memilih pesan yang tepat.
export interface AuthRepository {
  current(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signInWithProvider(provider: SsoProvider): Promise<Session>;
  signOut(): Promise<void>;

  // Kirim (atau kirim ulang) kode reset ke email; kode baru membatalkan kode sebelumnya.
  requestPasswordReset(email: string): Promise<ResetChallenge>;
  verifyResetCode(email: string, code: string): Promise<ResetGrant>;
  completePasswordReset(token: string, newPassword: string): Promise<void>;
  cancelPasswordReset(token: string): Promise<void>;
}
