import type { AuthRepository, SsoProvider } from "../application/auth-repository";
import { AuthError, displayNameFromEmail, normalizeEmail, PASSWORD_HINT, PASSWORD_MIN_LENGTH, validateEmail, type Credentials, type Session } from "../domain/auth";
import { MAX_CODE_ATTEMPTS, RESEND_COOLDOWN_MS, RESET_CODE_LENGTH, RESET_CODE_TTL_MS, RESET_TOKEN_TTL_MS, type ResetChallenge, type ResetGrant } from "../domain/password-reset";

const STORAGE_KEY = "tynext-ems.session.v1";
const SERVER_KEY = "tynext-ems.mock-auth.v1"; // "database" mock: password yang sudah di-reset, kode, dan token
const LATENCY_MS = 600;

// Domain email publik dianggap belum terdaftar, supaya state "No account uses this email" bisa dicoba.
const UNREGISTERED_DOMAINS = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]);

interface MockServerState {
  passwords: Record<string, string>; // email → hash password baru dari Forgot Password
  challenge?: { email: string; code: string; expiresAt: number; resendAvailableAt: number; attempts: number };
  grant?: { email: string; token: string; expiresAt: number };
}

// Mock Identity & Access. Email valid apa pun dengan password ≥ PASSWORD_MIN_LENGTH (10) karakter diterima, kecuali
// email yang password-nya sudah diganti lewat Forgot Password (wajib password baru). Kode reset
// dicetak ke console browser karena tidak ada email sungguhan. Offline (navigator.onLine false)
// memberi galat NETWORK. Sesi disimpan di localStorage sampai keluar. Diganti HttpAuthRepository
// saat VITE_DATA_SOURCE=http.
export class MockAuthRepository implements AuthRepository {
  private session: Session | null = null;

  constructor(
    private readonly storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage,
    private readonly now: () => Date = () => new Date(),
    private readonly online: () => boolean = () => typeof navigator === "undefined" || navigator.onLine !== false,
    private readonly deliverCode: (email: string, code: string) => void = (email, code) => console.info(`[mock] Password reset code for ${email}: ${code}`),
    private readonly latencyMs: number = LATENCY_MS,
  ) {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      this.session = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      this.session = null;
    }
  }

  async current(): Promise<Session | null> {
    await delay(Math.min(200, this.latencyMs));
    return this.session ? { ...this.session } : null;
  }

  async signIn(credentials: Credentials): Promise<Session> {
    await this.roundTrip();
    const email = normalizeEmail(credentials.email).toLowerCase();
    if (validateEmail(email)) throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password");
    const server = this.server();
    const resetHash = server.passwords[email];
    const valid = resetHash ? resetHash === hash(credentials.password) : credentials.password.length >= PASSWORD_MIN_LENGTH;
    if (!valid) throw new AuthError("INVALID_CREDENTIALS", "Incorrect email or password");
    if (server.grant?.email === email || server.challenge?.email === email) this.save({ ...server, grant: undefined, challenge: undefined }); // login biasa membatalkan reset yang aktif
    return this.start({ id: `usr-${hash(email)}`, name: displayNameFromEmail(email), email, role: email.startsWith("admin") ? "ADMIN" : "OPERATOR" });
  }

  async signInWithProvider(provider: SsoProvider): Promise<Session> {
    await this.roundTrip();
    return this.start({ id: `usr-${provider}`, name: "Demo Google", email: "demo.google@tynext.id", role: "VIEWER" });
  }

  async signOut(): Promise<void> {
    await delay(Math.min(200, this.latencyMs));
    this.session = null;
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      /* abaikan */
    }
  }

  async requestPasswordReset(rawEmail: string): Promise<ResetChallenge> {
    await this.roundTrip();
    const email = normalizeEmail(rawEmail).toLowerCase();
    if (validateEmail(email) || UNREGISTERED_DOMAINS.has(email.split("@")[1] ?? "")) throw new AuthError("EMAIL_NOT_REGISTERED", "No account uses this email");
    const server = this.server();
    const now = this.now().getTime();
    let challenge = server.challenge;
    // Selama jeda Resend, permintaan ulang tidak membuat kode baru.
    if (!challenge || challenge.email !== email || now >= challenge.resendAvailableAt) {
      challenge = { email, code: randomCode(), expiresAt: now + RESET_CODE_TTL_MS, resendAvailableAt: now + RESEND_COOLDOWN_MS, attempts: 0 };
      this.save({ ...server, challenge, grant: undefined });
    }
    this.deliverCode(email, challenge.code);
    return { email, expiresAt: new Date(challenge.expiresAt).toISOString(), resendAvailableAt: new Date(challenge.resendAvailableAt).toISOString() };
  }

  async verifyResetCode(rawEmail: string, code: string): Promise<ResetGrant> {
    await this.roundTrip();
    const email = normalizeEmail(rawEmail).toLowerCase();
    const server = this.server();
    const challenge = server.challenge;
    if (!challenge || challenge.email !== email) throw new AuthError("CODE_EXPIRED", "This code has expired");
    if (challenge.attempts >= MAX_CODE_ATTEMPTS) throw new AuthError("TOO_MANY_ATTEMPTS", "Too many attempts");
    if (this.now().getTime() >= challenge.expiresAt) throw new AuthError("CODE_EXPIRED", "This code has expired");
    if (code !== challenge.code) {
      const attempts = challenge.attempts + 1;
      this.save({ ...server, challenge: { ...challenge, attempts } });
      if (attempts >= MAX_CODE_ATTEMPTS) throw new AuthError("TOO_MANY_ATTEMPTS", "Too many attempts");
      throw new AuthError("CODE_MISMATCH", "That code doesn't match");
    }
    const grant = { email, token: randomToken(), expiresAt: this.now().getTime() + RESET_TOKEN_TTL_MS };
    this.save({ ...server, challenge: undefined, grant }); // kode sekali pakai
    return { token: grant.token, expiresAt: new Date(grant.expiresAt).toISOString() };
  }

  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    await this.roundTrip();
    const server = this.server();
    const grant = server.grant;
    if (!grant || grant.token !== token || this.now().getTime() >= grant.expiresAt) throw new AuthError("RESET_EXPIRED", "This reset session has expired");
    if (newPassword.length < PASSWORD_MIN_LENGTH) throw new AuthError("PASSWORD_REJECTED", PASSWORD_HINT);
    this.save({ ...server, grant: undefined, passwords: { ...server.passwords, [grant.email]: hash(newPassword) } });
  }

  async cancelPasswordReset(token: string): Promise<void> {
    await delay(Math.min(200, this.latencyMs));
    const server = this.server();
    if (server.grant?.token === token) this.save({ ...server, grant: undefined });
  }

  private async roundTrip() {
    await delay(this.latencyMs);
    if (!this.online()) throw new AuthError("NETWORK", "Can't reach the server");
  }

  private server(): MockServerState {
    try {
      const raw = this.storage?.getItem(SERVER_KEY);
      const parsed = raw ? (JSON.parse(raw) as MockServerState) : null;
      return parsed?.passwords ? parsed : { passwords: {} };
    } catch {
      return { passwords: {} };
    }
  }

  private save(state: MockServerState) {
    try {
      this.storage?.setItem(SERVER_KEY, JSON.stringify(state));
    } catch {
      /* state mock hanya hidup di memori */
    }
  }

  private start(user: Session["user"]): Session {
    this.session = { user, issuedAt: this.now().toISOString() };
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.session));
    } catch {
      /* sesi hanya hidup di memori */
    }
    return { ...this.session };
  }
}

function randomCode(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 10 ** RESET_CODE_LENGTH).padStart(RESET_CODE_LENGTH, "0");
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}
