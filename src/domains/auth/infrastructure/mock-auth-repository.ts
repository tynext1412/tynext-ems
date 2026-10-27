import type { AuthRepository, SsoProvider } from "../application/auth-repository";
import { displayNameFromEmail, validateCredentials, type Credentials, type Session } from "../domain/auth";

const STORAGE_KEY = "tynext-ems.session.v1";
const LATENCY_MS = 600;

// Mock Identity & Access: menerima email valid apa pun dengan kata sandi ≥ 6 karakter
// (tidak ada verifikasi), sesi disimpan di localStorage sampai keluar. Diganti adapter
// HTTP (OIDC/sesi backend) saat backend tersedia.
export class MockAuthRepository implements AuthRepository {
  private session: Session | null = null;

  constructor(
    private readonly storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage,
    private readonly now: () => Date = () => new Date(),
  ) {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      this.session = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      this.session = null;
    }
  }

  async current(): Promise<Session | null> {
    await delay(200);
    return this.session ? { ...this.session } : null;
  }

  async signIn(credentials: Credentials): Promise<Session> {
    await delay(LATENCY_MS);
    const errors = validateCredentials(credentials);
    if (errors.email || errors.password) throw new Error(errors.email ?? errors.password ?? "Kredensial tidak valid");
    const email = credentials.email.trim().toLowerCase();
    return this.start({ id: `usr-${hash(email)}`, name: displayNameFromEmail(email), email, role: email.startsWith("admin") ? "ADMIN" : "OPERATOR" });
  }

  async signInWithProvider(provider: SsoProvider): Promise<Session> {
    await delay(LATENCY_MS);
    const email = provider === "google" ? "demo.google@tynext.id" : "demo.microsoft@tynext.id";
    return this.start({ id: `usr-${provider}`, name: provider === "google" ? "Demo Google" : "Demo Microsoft", email, role: "VIEWER" });
  }

  async signOut(): Promise<void> {
    await delay(200);
    this.session = null;
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      /* abaikan */
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

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
