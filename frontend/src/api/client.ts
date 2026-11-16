// The only place that talks to the backend. Pages call the functions in api/*.ts.

export const API_BASE = '/api/v1'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = typeof body.detail === 'string' ? body.detail : message
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, message)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
