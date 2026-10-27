import { describe, expect, it } from "vitest";
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

describe("mock auth repository", () => {
  it("signs in any valid email, persists the session, and signs out", async () => {
    const storage = new MemoryStorage();
    const repo = new MockAuthRepository(storage, () => new Date("2026-10-27T01:00:00Z"));
    expect(await repo.current()).toBeNull();
    const session = await repo.signIn({ email: "Siti.Rahma@tynext.id", password: "rahasia" });
    expect(session.user).toMatchObject({ name: "Siti Rahma", email: "siti.rahma@tynext.id", role: "OPERATOR" });
    expect((await new MockAuthRepository(storage).current())?.user.email).toBe("siti.rahma@tynext.id");
    await repo.signOut();
    expect(await repo.current()).toBeNull();
    expect(await new MockAuthRepository(storage).current()).toBeNull();
  });

  it("rejects invalid credentials and grants admin to admin@ addresses", async () => {
    const repo = new MockAuthRepository(null);
    await expect(repo.signIn({ email: "x", password: "rahasia" })).rejects.toThrow(/email/i);
    await expect(repo.signIn({ email: "a@b.co", password: "123" })).rejects.toThrow(/Kata sandi/);
    expect((await repo.signIn({ email: "admin@tynext.id", password: "rahasia" })).user.role).toBe("ADMIN");
    expect((await repo.signInWithProvider("google")).user.role).toBe("VIEWER");
  });
});
