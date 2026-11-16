import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError, fieldErrors, readCookie } from "./apiClient";
import { dataUrlToBlob, orNull, query, resolveApiUrl } from "./http";

function json(status: number, body: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("ApiClient", () => {
  it("unwraps { data }, sends cookies, and adds the CSRF header only to unsafe methods", async () => {
    const fetch = vi.fn(async () => json(200, { data: { ok: true } }));
    const api = new ApiClient({ baseUrl: "/api/v1", fetch, csrfToken: () => "tok" });

    expect(await api.get("/plants")).toEqual({ ok: true });
    await api.post("/x", { a: 1 });
    await api.put("/x", { a: 1 });
    await api.patch("/x", { a: 1 });

    const [getUrl, getInit] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(getUrl).toBe("/api/v1/plants");
    expect(getInit.credentials).toBe("include");
    expect((getInit.headers as Record<string, string>)["X-CSRF-Token"]).toBeUndefined();
    for (const [, init] of fetch.mock.calls.slice(1) as unknown as [string, RequestInit][]) {
      const h = init.headers as Record<string, string>;
      expect(h["X-CSRF-Token"]).toBe("tok");
      expect(h["Content-Type"]).toBe("application/json");
      expect(init.body).toBe('{"a":1}');
    }
  });

  it("turns error bodies into ApiError with status, code, and details", async () => {
    const api = new ApiClient({
      baseUrl: "",
      fetch: async () => json(422, { error: "Some fields are invalid.", code: "VALIDATION_FAILED", details: { lat: "Latitude must be between -90 and 90" } }),
    });
    const err = await api.patch("/plants/PLT-1", {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, code: "VALIDATION_FAILED", message: "Some fields are invalid.", details: { lat: "Latitude must be between -90 and 90" } });
    expect(fieldErrors(err, ["lat", "lng"] as const)).toEqual({ lat: "Latitude must be between -90 and 90" });
    expect(fieldErrors(new Error("x"), ["lat"] as const)).toBeNull();
  });

  it("returns undefined for 204 and reports network failures as ApiError", async () => {
    expect(await new ApiClient({ baseUrl: "", fetch: async () => new Response(null, { status: 204 }) }).post("/auth/logout")).toBeUndefined();
    const down = new ApiClient({ baseUrl: "", fetch: async () => Promise.reject(new TypeError("Failed to fetch")) });
    await expect(down.get("/plants")).rejects.toMatchObject({ status: 0, code: "UPSTREAM_UNAVAILABLE" });
  });

  it("calls the unauthorized handler on 401 unless the call opts out", async () => {
    const onUnauthorized = vi.fn();
    const api = new ApiClient({ baseUrl: "", fetch: async () => json(401, { error: "Your session has ended.", code: "UNAUTHENTICATED" }), onUnauthorized });
    await expect(api.get("/plants")).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    await expect(api.get("/auth/session", { allowUnauthorized: true })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("sends FormData uploads without forcing a JSON content type", async () => {
    const fetch = vi.fn(async () => json(200, { data: 1 }));
    const form = new FormData();
    form.append("files", new Blob(["x"], { type: "image/png" }), "a.png");
    await new ApiClient({ baseUrl: "", fetch, csrfToken: () => "t" }).upload("/maintenance/1/photos", form);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    expect((init.headers as Record<string, string>)["X-CSRF-Token"]).toBe("t");
  });
});

describe("http helpers", () => {
  it("reads cookies, builds queries, and resolves backend paths", () => {
    expect(readCookie("tynext_csrf", "a=1; tynext_csrf=abc%3D; b=2")).toBe("abc=");
    expect(readCookie("x", "a=1")).toBeUndefined();
    expect(query({ granularity: "day", date: "2026-11-02", skip: undefined })).toBe("?granularity=day&date=2026-11-02");
    expect(resolveApiUrl("/api/v1/maintenance-photos/PH-1", "/api/v1")).toBe("/api/v1/maintenance-photos/PH-1");
    expect(resolveApiUrl("/api/v1/maintenance-photos/PH-1", "https://api.tynext.id/api/v1")).toBe("https://api.tynext.id/api/v1/maintenance-photos/PH-1");
    expect(resolveApiUrl("https://cdn.x/p.jpg", "https://api.tynext.id/api/v1")).toBe("https://cdn.x/p.jpg");
  });

  it("turns 404 into null and decodes data URLs", async () => {
    expect(await orNull(Promise.reject(new ApiError(404, "Plant PLT-9 not found.", "NOT_FOUND")))).toBeNull();
    await expect(orNull(Promise.reject(new ApiError(500, "boom")))).rejects.toMatchObject({ status: 500 });
    const blob = dataUrlToBlob("data:image/png;base64,iVBORw0KGgo=");
    expect(blob.type).toBe("image/png");
    expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    expect(() => dataUrlToBlob("not a data url")).toThrow();
  });
});
