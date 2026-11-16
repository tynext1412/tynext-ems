import { env } from "@/shared/config/env";

// Error dari backend: { error, code, details? } (lihat kontrak OpenAPI, skema Error).
// `message` = body.error, kalimat Inggris singkat yang aman ditampilkan ke pengguna.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "INTERNAL",
    public readonly details: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

interface ErrorBody {
  error?: string;
  code?: string;
  details?: Record<string, string>;
}

const CSRF_COOKIE = "tynext_csrf";
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type Fetch = typeof fetch;

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: Fetch;
  // Nilai cookie CSRF (double submit); bawaan membaca document.cookie.
  csrfToken?: () => string | undefined;
  // Dipanggil saat endpoint mana pun mengembalikan 401 (sesi habis).
  onUnauthorized?: () => void;
}

export function readCookie(name: string, cookie: string = typeof document === "undefined" ? "" : document.cookie): string | undefined {
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

// Klien HTTP untuk API dashboard: amplop { data }, cookie sesi (credentials: "include"),
// header X-CSRF-Token untuk request yang mengubah data, dan ApiError untuk status non-2xx.
export class ApiClient {
  private unauthorized?: () => void;

  constructor(private readonly options: ApiClientOptions) {
    this.unauthorized = options.onUnauthorized;
  }

  get baseUrl(): string {
    return this.options.baseUrl;
  }

  setUnauthorizedHandler(fn: (() => void) | undefined) {
    this.unauthorized = fn;
  }

  get<T>(path: string, opts?: { allowUnauthorized?: boolean }): Promise<T> {
    return this.request<T>("GET", path, undefined, opts);
  }

  post<T>(path: string, body?: unknown, opts?: { allowUnauthorized?: boolean }): Promise<T> {
    return this.request<T>("POST", path, body, opts);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T = void>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  // multipart/form-data; Content-Type (dengan boundary) diisi browser.
  upload<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>("POST", path, form);
  }

  private async request<T>(method: string, path: string, body?: unknown, opts?: { allowUnauthorized?: boolean }): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    let payload: BodyInit | undefined;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    if (UNSAFE.has(method)) {
      const token = (this.options.csrfToken ?? (() => readCookie(CSRF_COOKIE)))();
      if (token) headers["X-CSRF-Token"] = token;
    }

    const doFetch = this.options.fetch ?? globalThis.fetch.bind(globalThis);
    let res: Response;
    try {
      res = await doFetch(`${this.options.baseUrl}${path}`, { method, headers, body: payload, credentials: "include" });
    } catch {
      throw new ApiError(0, "Can't reach the server. Check your connection and try again.", "UPSTREAM_UNAVAILABLE");
    }

    if (res.status === 204) return undefined as T;
    const parsed = (await res.json().catch(() => null)) as ({ data?: T } & ErrorBody) | null;
    if (!res.ok) {
      if (res.status === 401 && !opts?.allowUnauthorized) this.unauthorized?.();
      // Hanya body error backend yang dipakai; body lain (mis. 404 dari hosting: { error: { code, message } }) diabaikan.
      const message = typeof parsed?.error === "string" ? parsed.error : res.statusText || `Request failed (${res.status})`;
      const code = typeof parsed?.code === "string" ? parsed.code : undefined;
      throw new ApiError(res.status, message, code, typeof parsed?.error === "string" ? (parsed?.details ?? {}) : {});
    }
    if (!parsed || !("data" in parsed)) throw new ApiError(res.status, "The server sent an empty response.");
    return parsed.data as T;
  }
}

// Tanpa VITE_API_BASE_URL: /api/v1 di origin dashboard (proxy Vite di dev, reverse proxy di produksi).
export const apiClient = new ApiClient({ baseUrl: env.apiBaseUrl || "/api/v1" });

// Pesan per field dari 422 (details), hanya untuk field yang dikenal form; null bila bukan error validasi.
export function fieldErrors<K extends string>(e: unknown, fields: readonly K[]): Partial<Record<K, string>> | null {
  if (!isApiError(e) || Object.keys(e.details).length === 0) return null;
  const out: Partial<Record<K, string>> = {};
  for (const f of fields) if (e.details[f]) out[f] = e.details[f];
  return Object.keys(out).length > 0 ? out : null;
}
