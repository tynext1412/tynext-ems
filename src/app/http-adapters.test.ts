import { describe, expect, it, vi } from "vitest";
import { authErrorCode } from "@/domains/auth/domain/auth";
import { HttpAuthRepository } from "@/domains/auth/infrastructure/http-auth-repository";
import { HttpMaintenanceRepository } from "@/domains/maintenance/infrastructure/http-maintenance-repository";
import { HttpPerformanceRepository, UNSET_PURCHASE_TARIFF } from "@/domains/performance/infrastructure/http-performance-repository";
import { HttpScadaRepository } from "@/domains/scada/infrastructure/http-scada-repository";
import { ApiClient } from "@/shared/lib/apiClient";
import { createHttpRepositories } from "./container";

type Route = (url: URL, init: RequestInit) => Response | undefined;

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
const ok = (data: unknown) => json(200, { data });
const notFound = (msg = "Not found.") => json(404, { error: msg, code: "NOT_FOUND" });

// Fetch palsu: rute pertama yang menjawab menang; setiap panggilan dicatat.
function fakeApi(...routes: Route[]) {
  const calls: { method: string; url: URL; init: RequestInit }[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), "http://dash.test");
    calls.push({ method: init.method ?? "GET", url, init });
    for (const r of routes) {
      const res = r(url, init);
      if (res) return res;
    }
    return notFound("Endpoint not found.");
  }) as unknown as typeof globalThis.fetch;
  return { api: new ApiClient({ baseUrl: "/api/v1", fetch, csrfToken: () => "csrf" }), calls };
}

const on = (method: string, path: string, res: () => Response): Route => (url, init) => ((init.method ?? "GET") === method && url.pathname === `/api/v1${path}` ? res() : undefined);

describe("HTTP adapters", () => {
  it("call the contract paths with the right query parameters", async () => {
    const { api, calls } = fakeApi((url) => (url.pathname.endsWith("/scada-embed") || url.pathname.endsWith("/weather") || url.pathname.endsWith("/latest") || url.pathname.endsWith("/reading") ? ok(null) : ok([])));
    const r = createHttpRepositories(api);
    await r.plant.findAll();
    await r.plant.weatherReport("PLT-003");
    await r.performance.findAll();
    await r.performance.operatingData({ plantId: "PLT-003", granularity: "month", date: "2026-11-02" });
    await r.performance.energySeries("PLT-003", "year", "2026-11-02");
    await r.performance.tariffSeries("PLT-003", "2026-11-02");
    await r.telemetry.latest("PLT-003");
    await r.telemetry.dailySeries("PLT-003", "2026-11-02");
    await r.alarm.findByPlant("PLT-003");
    await r.scada.embedFor("PLT-003");
    await r.device.findByPlant("PLT-003");
    await r.deviceTelemetry.latest("PLT-003-INV-01");
    await r.deviceTelemetry.dailySeries("PLT-003-INV-01", "2026-11-02");
    await r.deviceTelemetry.energySeries("PLT-003-INV-01", "lifetime", "2026-11-02");
    await r.maintenance.findByPlant("PLT-003");
    expect(calls.map((c) => c.url.pathname + c.url.search)).toEqual([
      "/api/v1/plants",
      "/api/v1/plants/PLT-003/weather",
      "/api/v1/performances",
      "/api/v1/plants/PLT-003/operating-data?granularity=month&date=2026-11-02",
      "/api/v1/plants/PLT-003/energy-series?granularity=year&date=2026-11-02",
      "/api/v1/plants/PLT-003/tariff-series?date=2026-11-02",
      "/api/v1/plants/PLT-003/power/latest",
      "/api/v1/plants/PLT-003/power/daily?date=2026-11-02",
      "/api/v1/plants/PLT-003/alarms",
      "/api/v1/plants/PLT-003/scada-embed",
      "/api/v1/plants/PLT-003/devices",
      "/api/v1/devices/PLT-003-INV-01/reading",
      "/api/v1/devices/PLT-003-INV-01/series/daily?date=2026-11-02",
      "/api/v1/devices/PLT-003-INV-01/series/energy?granularity=lifetime&date=2026-11-02",
      "/api/v1/plants/PLT-003/maintenance",
    ]);
    expect(calls.every((c) => c.init.credentials === "include")).toBe(true);
  });

  it("map 404 on find endpoints to null", async () => {
    const r = createHttpRepositories(fakeApi(() => notFound()).api);
    expect(await r.plant.findById("PLT-999")).toBeNull();
    expect(await r.device.findById("PLT-999-INV-01")).toBeNull();
    expect(await r.deviceTelemetry.latest("PLT-999-INV-01")).toBeNull();
  });

  it("keep only domain fields on alarms and drop an absent clearedAt", async () => {
    const r = createHttpRepositories(
      fakeApi(
        on("GET", "/plants/PLT-1/alarms", () =>
          ok([
            { id: "1", plantId: "PLT-1", deviceId: "PLT-1-INV-01", deviceType: "INVERTER", code: "GRID_LOSS", severity: "CRITICAL", message: "Grid lost.", raisedAt: "2026-11-02T01:00:00Z", clearedAt: "2026-11-02T01:42:00Z" },
            { id: "2", plantId: "PLT-1", deviceId: "PLT-1-INV-01", deviceType: "INVERTER", code: "OVER_TEMP", severity: "WARNING", message: "Hot.", raisedAt: "2026-11-02T02:00:00Z" },
          ]),
        ),
      ).api,
    );
    const alarms = await r.alarm.findByPlant("PLT-1");
    expect(alarms[0]).not.toHaveProperty("deviceType");
    expect(alarms[0].clearedAt).toBe("2026-11-02T01:42:00Z");
    expect(alarms[1]).not.toHaveProperty("clearedAt");
  });

  it("falls back to an empty purchase tariff when none is set, and sends bands only for time of use", async () => {
    const { api, calls } = fakeApi(on("GET", "/plants/PLT-1/purchase-tariff", () => notFound("No purchase tariff is set for this plant yet.")), on("PUT", "/plants/PLT-1/purchase-tariff", () => ok({ mode: "FLAT", baseRateIDRPerKWh: 1500, bands: [] })));
    const repo = new HttpPerformanceRepository(api);
    expect(await repo.purchaseTariff("PLT-1")).toEqual(UNSET_PURCHASE_TARIFF);
    await repo.updatePurchaseTariff("PLT-1", { mode: "FLAT", baseRateIDRPerKWh: 1500, bands: [{ startHour: 1, endHour: 2, rateIDRPerKWh: 9 }] });
    const put = calls.find((c) => c.method === "PUT")!;
    expect(JSON.parse(String(put.init.body))).toEqual({ mode: "FLAT", baseRateIDRPerKWh: 1500, bands: [] });
    expect((put.init.headers as Record<string, string>)["X-CSRF-Token"]).toBe("csrf");
  });

  it("uses the SCADA URL template only when the backend has no viewer", async () => {
    const none = new HttpScadaRepository(fakeApi(() => ok(null)).api, "https://scada.x/{plantId}");
    expect(await none.embedFor("PLT-1")).toEqual({ provider: "SCADA viewer", url: "https://scada.x/{plantId}", allowFullscreen: true });
    const configured = new HttpScadaRepository(fakeApi(() => ok({ provider: "Ignition", url: "https://ign/{plantId}", allowFullscreen: false })).api, "https://scada.x/{plantId}");
    expect((await configured.embedFor("PLT-1"))?.provider).toBe("Ignition");
  });

  it("maps maintenance photos to dataUrl and updates fields before uploading photos", async () => {
    const activity = (photos: unknown[] = []) => ({
      id: "OM-1", plantId: "PLT-1", date: "2026-11-20", type: "REGULAR", activity: "Clean modules", notes: "", photos,
      completedAt: null, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
    });
    const photo = { id: "PH-1", name: "a.jpg", url: "/api/v1/maintenance-photos/PH-1", uploadedAt: "2026-11-02T00:00:00Z" };
    const { api, calls } = fakeApi(
      on("PATCH", "/maintenance/OM-1", () => ok(activity())),
      on("POST", "/maintenance/OM-1/photos", () => ok(activity([photo]))),
      on("POST", "/plants/PLT-1/maintenance", () => json(201, { data: activity() })),
    );
    const repo = new HttpMaintenanceRepository(api);

    const created = await repo.create("PLT-1", { date: "2026-11-20", type: "REGULAR", activity: "  Clean modules ", notes: "" });
    expect(created.id).toBe("OM-1");
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ activity: "Clean modules" });

    const updated = await repo.update("OM-1", { notes: "Done", removePhotoIds: ["PH-0"], addPhotos: [{ name: "a.jpg", dataUrl: "data:image/jpeg;base64,/9j/4AAQ" }] });
    expect(calls.slice(1).map((c) => c.method + " " + c.url.pathname)).toEqual(["PATCH /api/v1/maintenance/OM-1", "POST /api/v1/maintenance/OM-1/photos"]);
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ notes: "Done", removePhotoIds: ["PH-0"] });
    const form = calls[2].init.body as FormData;
    const file = form.getAll("files")[0] as File;
    expect(file.name).toBe("a.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(updated.photos).toEqual([{ id: "PH-1", name: "a.jpg", dataUrl: "/api/v1/maintenance-photos/PH-1", uploadedAt: "2026-11-02T00:00:00Z" }]);

    calls.length = 0;
    await repo.update("OM-1", { addPhotos: [{ name: "b.jpg", dataUrl: "data:image/jpeg;base64,/9j/4AAQ" }] });
    expect(calls.map((c) => c.method)).toEqual(["POST"]); // tanpa field lain: hanya unggah
  });
});

describe("HTTP auth adapter", () => {
  it("treats 401 on /auth/session as signed out", async () => {
    const repo = new HttpAuthRepository(fakeApi(on("GET", "/auth/session", () => json(401, { error: "Your session has ended.", code: "UNAUTHENTICATED" }))).api);
    expect(await repo.current()).toBeNull();
  });

  it("signs in, surfaces the server message, and signs out even when the session already ended", async () => {
    const session = { user: { id: "U1", name: "Ops", email: "ops@tynext.id", role: "OPERATOR" }, issuedAt: "2026-11-16T00:00:00Z" };
    const { api } = fakeApi((url, init) => {
      if (url.pathname === "/api/v1/auth/login") {
        const body = JSON.parse(String(init.body)) as { password: string };
        return body.password === "right-password" ? ok(session) : json(401, { error: "Email or password is incorrect.", code: "UNAUTHENTICATED" });
      }
      if (url.pathname === "/api/v1/auth/logout") return json(401, { error: "Your session has ended.", code: "UNAUTHENTICATED" });
      return undefined;
    });
    const repo = new HttpAuthRepository(api);
    expect(await repo.signIn({ email: " ops@tynext.id ", password: "right-password" })).toEqual(session);
    await expect(repo.signIn({ email: "ops@tynext.id", password: "wrong-password" })).rejects.toThrow("Email or password is incorrect.");
    await expect(repo.signOut()).resolves.toBeUndefined();
  });

  it("redirects the browser to the SSO start URL with returnTo", () => {
    const redirect = vi.fn();
    const repo = new HttpAuthRepository(fakeApi().api, redirect, () => "/plants/PLT-003?tab=device");
    void repo.signInWithProvider("google");
    expect(redirect).toHaveBeenCalledWith("/api/v1/auth/sso/google/start?returnTo=%2Fplants%2FPLT-003%3Ftab%3Ddevice");
  });

  it("maps login failures to the codes the sign-in alerts use", async () => {
    const reply: Record<string, Response> = {
      wrong: json(401, { error: "Email or password is incorrect.", code: "UNAUTHENTICATED" }),
      blocked: json(403, { error: "No access.", code: "FORBIDDEN" }),
      down: json(503, { error: "Service unavailable.", code: "UPSTREAM_UNAVAILABLE" }),
      busy: json(429, { error: "Too many sign-in attempts. Try again in a minute.", code: "RATE_LIMITED" }),
    };
    const repo = new HttpAuthRepository(
      fakeApi((url, init) => {
        if (url.pathname !== "/api/v1/auth/login") return undefined;
        const password = (JSON.parse(String(init.body)) as { password: string }).password;
        if (password === "offline") throw new TypeError("Failed to fetch");
        return reply[password];
      }).api,
    );
    const code = (password: string) => repo.signIn({ email: "ops@tynext.id", password }).catch((e: unknown) => authErrorCode(e) ?? (e as Error).message);
    expect(await code("wrong")).toBe("INVALID_CREDENTIALS");
    expect(await code("blocked")).toBe("NO_ACCESS");
    expect(await code("offline")).toBe("NETWORK"); // server tak terjangkau
    expect(await code("down")).toBe("Service unavailable."); // 5xx: pesan server apa adanya
    expect(await code("busy")).toBe("Too many sign-in attempts. Try again in a minute.");
  });

  it("calls the password-reset endpoints and maps their error codes", async () => {
    const { api, calls } = fakeApi(
      // Bentuk jawaban sesuai kontrak (tynext-mqtt OpenAPI, tag Auth): request tidak mengembalikan email.
      on("POST", "/auth/password-reset/request", () => ok({ expiresAt: "2026-11-16T01:10:00Z", resendAvailableAt: "2026-11-16T01:01:00Z" })),
      on("POST", "/auth/password-reset/verify", () => ok({ resetToken: "tok", expiresAt: "2026-11-16T01:15:00Z" })),
      (url, init) => {
        if (url.pathname !== "/api/v1/auth/password-reset/complete") return undefined;
        const body = JSON.parse(String(init.body)) as { newPassword: string };
        if (body.newPassword.length < 10) return json(422, { error: "Some fields are invalid.", code: "VALIDATION_FAILED", details: { newPassword: "Password must be at least 10 characters" } });
        return json(410, { error: "This reset session has expired.", code: "RESET_EXPIRED" });
      },
      on("POST", "/auth/password-reset/cancel", () => new Response(null, { status: 204 })),
    );
    const repo = new HttpAuthRepository(api);
    expect(await repo.requestPasswordReset(" ops@tynext.id ")).toEqual({ email: "ops@tynext.id", expiresAt: "2026-11-16T01:10:00Z", resendAvailableAt: "2026-11-16T01:01:00Z" });
    expect(await repo.verifyResetCode("ops@tynext.id", "482917")).toEqual({ token: "tok", expiresAt: "2026-11-16T01:15:00Z" });
    const rejected = await repo.completePasswordReset("tok", "Plant2026").catch((e: unknown) => e as Error);
    expect([authErrorCode(rejected), rejected?.message]).toEqual(["PASSWORD_REJECTED", "Password must be at least 10 characters"]);
    await expect(repo.completePasswordReset("tok", "Plant2026-Solar")).rejects.toSatisfy((e) => authErrorCode(e) === "RESET_EXPIRED");
    await repo.cancelPasswordReset("tok");
    expect(calls.map((c) => JSON.parse(String(c.init.body)) as unknown)).toEqual([
      { email: "ops@tynext.id" },
      { email: "ops@tynext.id", code: "482917" },
      { resetToken: "tok", newPassword: "Plant2026" },
      { resetToken: "tok", newPassword: "Plant2026-Solar" },
      { resetToken: "tok" },
    ]);

    const errors = new HttpAuthRepository(
      fakeApi(
        on("POST", "/auth/password-reset/request", () => json(404, { error: "No account uses this email.", code: "EMAIL_NOT_REGISTERED" })),
        on("POST", "/auth/password-reset/verify", () => json(429, { error: "Too many attempts.", code: "TOO_MANY_ATTEMPTS" })),
      ).api,
    );
    await expect(errors.requestPasswordReset("dadang@gmail.com")).rejects.toSatisfy((e) => authErrorCode(e) === "EMAIL_NOT_REGISTERED");
    await expect(errors.verifyResetCode("ops@tynext.id", "000000")).rejects.toSatisfy((e) => authErrorCode(e) === "TOO_MANY_ATTEMPTS");

    // SMTP belum dikonfigurasi (503) dan endpoint yang tidak ada (404 polos) tampil dengan pesan server, bukan "cek koneksi".
    const smtp = new HttpAuthRepository(fakeApi(on("POST", "/auth/password-reset/request", () => json(503, { error: "Email isn't set up yet. Contact your administrator.", code: "UPSTREAM_UNAVAILABLE" }))).api);
    await expect(smtp.requestPasswordReset("ops@tynext.id")).rejects.toSatisfy((e) => authErrorCode(e) === null && (e as Error).message === "Email isn't set up yet. Contact your administrator.");
    const missing = new HttpAuthRepository(fakeApi().api);
    await expect(missing.requestPasswordReset("ops@tynext.id")).rejects.toSatisfy((e) => authErrorCode(e) === null);
  });
});
