import { isApiError } from "./apiClient";

// Bantuan kecil untuk adapter HTTP.

export const enc = encodeURIComponent;

export function query(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

// 404 dari endpoint "find" berarti tidak ada (null), bukan error.
export async function orNull<T>(p: Promise<T | null>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (isApiError(e) && e.status === 404) return null;
    throw e;
  }
}

// URL relatif dari backend ("/api/v1/...") diarahkan ke host API bila base URL absolut;
// dengan proxy Vite (base "/api/v1") URL dibiarkan relatif ke origin dashboard.
export function resolveApiUrl(url: string, apiBaseUrl: string): string {
  if (!url.startsWith("/") || url.startsWith("//")) return url;
  try {
    return new URL(url, new URL(apiBaseUrl)).toString();
  } catch {
    return url;
  }
}

// data:image/jpeg;base64,... → Blob (tanpa fetch, supaya juga jalan di test Node).
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Photo data is not a valid data URL");
  const type = match[1] ?? "application/octet-stream";
  const raw = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type });
}
