/** The only place that talks to the backend. Pages import from src/api/*, never fetch directly. */

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "true") === "true";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function query(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Small delay so mock data behaves like a network call. */
export const mockDelay = <T>(value: T, ms = 250) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
