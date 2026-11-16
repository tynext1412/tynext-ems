import { isApiError, type ApiClient } from "@/shared/lib/apiClient";
import type { AuthRepository, SsoProvider } from "../application/auth-repository";
import { AuthError, normalizeEmail, type AuthErrorCode, type Credentials, type Session } from "../domain/auth";
import type { ResetChallenge, ResetGrant } from "../domain/password-reset";

// Halaman tujuan setelah SSO: state.from yang disimpan RequireAuth (react-router menaruh
// state di history.state.usr). Hanya path di dashboard sendiri.
function defaultReturnTo(): string {
  const from = (globalThis.history?.state as { usr?: { from?: unknown } } | null)?.usr?.from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login") ? from : "/";
}

const RESET_CODES = new Set<AuthErrorCode>(["EMAIL_NOT_REGISTERED", "CODE_MISMATCH", "CODE_EXPIRED", "TOO_MANY_ATTEMPTS", "RESET_EXPIRED", "NO_ACCESS", "INVALID_CREDENTIALS"]);

// Jawaban server → AuthError. Kode spesifik dari body (`code`) diutamakan; selain itu status:
// server tak terjangkau (status 0) → NETWORK, sisanya pakai `byStatus` per endpoint. Galat lain
// (mis. 503 "email belum dikonfigurasi", 429 RATE_LIMITED) diteruskan dengan pesan server.
function toAuthError(e: unknown, byStatus: Partial<Record<number, AuthErrorCode>> = {}): unknown {
  if (!isApiError(e)) return e;
  if (RESET_CODES.has(e.code as AuthErrorCode)) return new AuthError(e.code as AuthErrorCode, e.message);
  if (e.status === 0) return new AuthError("NETWORK", e.message);
  const code = byStatus[e.status];
  return code ? new AuthError(code, e.message) : e;
}

async function mapErrors<T>(p: Promise<T>, byStatus?: Partial<Record<number, AuthErrorCode>>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    throw toAuthError(e, byStatus);
  }
}

// Adapter HTTP untuk AuthRepository: sesi cookie dari backend (/auth/*).
export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly api: ApiClient,
    private readonly redirect: (url: string) => void = (url) => globalThis.location.assign(url),
    private readonly returnTo: () => string = defaultReturnTo,
  ) {}

  async current(): Promise<Session | null> {
    try {
      return await this.api.get<Session>("/auth/session", { allowUnauthorized: true });
    } catch (e) {
      if (isApiError(e) && e.status === 401) return null;
      throw e;
    }
  }

  signIn(credentials: Credentials): Promise<Session> {
    return mapErrors(this.api.post<Session>("/auth/login", { email: normalizeEmail(credentials.email), password: credentials.password }, { allowUnauthorized: true }), { 401: "INVALID_CREDENTIALS", 403: "NO_ACCESS" });
  }

  // SSO meninggalkan halaman: browser diarahkan ke provider, callback backend memasang cookie
  // lalu kembali ke returnTo (galat kembali sebagai /login?error=sso_*). Promise sengaja tidak
  // pernah selesai (halaman akan berganti).
  signInWithProvider(provider: SsoProvider): Promise<Session> {
    this.redirect(`${this.api.baseUrl}/auth/sso/${provider}/start?returnTo=${encodeURIComponent(this.returnTo())}`);
    return new Promise<Session>(() => {});
  }

  async signOut(): Promise<void> {
    try {
      await this.api.post<void>("/auth/logout", undefined, { allowUnauthorized: true });
    } catch (e) {
      if (!(isApiError(e) && e.status === 401)) throw e; // sesi sudah habis: tetap dianggap keluar
    }
  }

  requestPasswordReset(email: string): Promise<ResetChallenge> {
    // Hanya body code EMAIL_NOT_REGISTERED yang berarti email tidak terdaftar; 404 polos bisa juga
    // berarti endpoint belum ada di backend, jadi tampil sebagai "Couldn't send the code".
    const normalized = normalizeEmail(email);
    return mapErrors(
      this.api.post<Omit<ResetChallenge, "email">>("/auth/password-reset/request", { email: normalized }, { allowUnauthorized: true }).then((r) => ({ email: normalized, expiresAt: r.expiresAt, resendAvailableAt: r.resendAvailableAt })),
    );
  }

  verifyResetCode(email: string, code: string): Promise<ResetGrant> {
    return mapErrors(
      this.api.post<{ resetToken: string; expiresAt: string }>("/auth/password-reset/verify", { email: normalizeEmail(email), code }, { allowUnauthorized: true }).then((r) => ({ token: r.resetToken, expiresAt: r.expiresAt })),
      { 410: "CODE_EXPIRED", 422: "CODE_MISMATCH", 429: "TOO_MANY_ATTEMPTS" },
    );
  }

  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      await this.api.post<void>("/auth/password-reset/complete", { resetToken: token, newPassword }, { allowUnauthorized: true });
    } catch (e) {
      // 422 dengan details.newPassword = aturan password server (backend: minimal 10 karakter).
      if (isApiError(e) && e.details.newPassword) throw new AuthError("PASSWORD_REJECTED", e.details.newPassword);
      throw toAuthError(e, { 401: "RESET_EXPIRED", 410: "RESET_EXPIRED" });
    }
  }

  async cancelPasswordReset(token: string): Promise<void> {
    await this.api.post<void>("/auth/password-reset/cancel", { resetToken: token }, { allowUnauthorized: true });
  }
}
