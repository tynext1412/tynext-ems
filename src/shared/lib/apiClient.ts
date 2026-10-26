import { env } from "@/shared/config/env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Envelope respons backend: { data, error?, message?, meta? }
interface Envelope<T> {
  data: T;
  error?: string;
  message?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }
  if (!body) {
    throw new ApiError(res.status, "empty response body");
  }
  return body.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
};
