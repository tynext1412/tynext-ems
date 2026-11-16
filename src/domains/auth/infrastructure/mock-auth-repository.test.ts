import { describe, expect, it } from "vitest";
import { authErrorCode } from "../domain/auth";
import { MockAuthRepository } from "./mock-auth-repository";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(k: string) { return this.map.get(k) ?? null; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  removeItem(k: string) { this.map.delete(k); }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

const codeOf = (p: Promise<unknown>) => p.then(() => "OK", (e: unknown) => authErrorCode(e));

function setup(start = "2026-11-16T01:00:00Z") {
  const storage = new MemoryStorage();
  const clock = { now: new Date(start) };
  const online = { value: true };
  const sent: string[] = [];
  const make = () => new MockAuthRepository(storage, () => clock.now, () => online.value, (_email, code) => sent.push(code), 0);
  const advance = (ms: number) => (clock.now = new Date(clock.now.getTime() + ms));
  return { storage, clock, online, sent, make, advance, repo: make() };
}

describe("mock auth repository", () => {
  it("signs in any valid email, persists the session, and signs out", async () => {
    const { storage, repo } = setup();
    expect(await repo.current()).toBeNull();
    const session = await repo.signIn({ email: " Siti.Rahma@tynext.id ", password: "rahasia" });
    expect(session.user).toMatchObject({ name: "Siti Rahma", email: "siti.rahma@tynext.id", role: "OPERATOR" });
    expect((await new MockAuthRepository(storage).current())?.user.email).toBe("siti.rahma@tynext.id");
    await repo.signOut();
    expect(await repo.current()).toBeNull();
    expect(await new MockAuthRepository(storage).current()).toBeNull();
  });

  it("rejects short passwords as incorrect credentials, reports offline, and grants admin to admin@", async () => {
    const { repo, online } = setup();
    expect(await codeOf(repo.signIn({ email: "a@b.co", password: "123" }))).toBe("INVALID_CREDENTIALS");
    expect((await repo.signIn({ email: "admin@tynext.id", password: "rahasia" })).user.role).toBe("ADMIN");
    expect((await repo.signInWithProvider("google")).user.role).toBe("VIEWER");
    online.value = false;
    expect(await codeOf(repo.signIn({ email: "ops@tynext.id", password: "rahasia" }))).toBe("NETWORK");
  });

  it("runs the forgot-password flow: send, verify once, save, then only the new password works", async () => {
    const { repo, sent, make } = setup();
    expect(await codeOf(repo.requestPasswordReset("dadang@gmail.com"))).toBe("EMAIL_NOT_REGISTERED");
    const challenge = await repo.requestPasswordReset(" Dadang@tynext.co.id ");
    expect(challenge).toEqual({ email: "dadang@tynext.co.id", expiresAt: "2026-11-16T01:10:00.000Z", resendAvailableAt: "2026-11-16T01:01:00.000Z" });
    expect(sent[0]).toMatch(/^\d{6}$/);

    const wrong = sent[0] === "000000" ? "111111" : "000000";
    expect(await codeOf(repo.verifyResetCode("dadang@tynext.co.id", wrong))).toBe("CODE_MISMATCH");
    const grant = await make().verifyResetCode("dadang@tynext.co.id", sent[0]); // state "server" bertahan setelah refresh
    expect(await codeOf(repo.verifyResetCode("dadang@tynext.co.id", sent[0]))).toBe("CODE_EXPIRED"); // kode sekali pakai

    expect(await codeOf(repo.completePasswordReset("not-the-token", "Plant2026"))).toBe("RESET_EXPIRED");
    expect(await codeOf(repo.completePasswordReset(grant.token, "abc"))).toBe("PASSWORD_REJECTED");
    await repo.completePasswordReset(grant.token, "Plant2026");
    expect(await codeOf(repo.completePasswordReset(grant.token, "Plant2026"))).toBe("RESET_EXPIRED");
    expect(await codeOf(repo.signIn({ email: "dadang@tynext.co.id", password: "old-password" }))).toBe("INVALID_CREDENTIALS");
    expect((await repo.signIn({ email: "dadang@tynext.co.id", password: "Plant2026" })).user.email).toBe("dadang@tynext.co.id");
  });

  it("keeps the code during the resend cooldown, expires it after 10 minutes, and locks after 5 wrong tries", async () => {
    const { repo, sent, advance } = setup();
    await repo.requestPasswordReset("ops@tynext.id");
    advance(30_000);
    await repo.requestPasswordReset("ops@tynext.id");
    expect(sent[1]).toBe(sent[0]); // masih dalam jeda 60 detik: kode sama
    advance(31_000);
    await repo.requestPasswordReset("ops@tynext.id");
    const latest = sent[2];
    if (sent[0] !== latest) expect(await codeOf(repo.verifyResetCode("ops@tynext.id", sent[0]))).toBe("CODE_MISMATCH"); // kode lama batal
    else expect(await codeOf(repo.verifyResetCode("ops@tynext.id", "999999"))).not.toBe("OK"); // (kode acak kebetulan sama)

    const wrong = latest === "000000" ? "111111" : "000000";
    for (let i = 0; i < 3; i++) expect(await codeOf(repo.verifyResetCode("ops@tynext.id", wrong))).toBe("CODE_MISMATCH");
    expect(await codeOf(repo.verifyResetCode("ops@tynext.id", wrong))).toBe("TOO_MANY_ATTEMPTS");
    expect(await codeOf(repo.verifyResetCode("ops@tynext.id", latest))).toBe("TOO_MANY_ATTEMPTS"); // terkunci walau benar

    advance(60_000);
    await repo.requestPasswordReset("ops@tynext.id"); // kode baru membuka kunci
    advance(10 * 60_000);
    expect(await codeOf(repo.verifyResetCode("ops@tynext.id", sent[3]))).toBe("CODE_EXPIRED");
  });

  it("cancels the reset token on Back to Sign In and on a normal sign-in", async () => {
    const { repo, sent } = setup();
    await repo.requestPasswordReset("ops@tynext.id");
    const grant = await repo.verifyResetCode("ops@tynext.id", sent[0]);
    await repo.cancelPasswordReset(grant.token);
    expect(await codeOf(repo.completePasswordReset(grant.token, "Plant2026"))).toBe("RESET_EXPIRED");

    await repo.requestPasswordReset("ops@tynext.id");
    const second = await repo.verifyResetCode("ops@tynext.id", sent[1]);
    await repo.signIn({ email: "ops@tynext.id", password: "old-password" });
    expect(await codeOf(repo.completePasswordReset(second.token, "Plant2026"))).toBe("RESET_EXPIRED");
  });
});
