// Minimal typed fetch wrapper.
//
// All requests use a relative `/api` base. In dev, Vite proxies it to the .NET
// API; in prod, the reverse proxy does the same. Same-origin everywhere → no CORS.
const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`)
  }
  // 204 No Content has no body to parse.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

// ---- Response types (mirror the .NET API) ----

export interface HealthResponse {
  status: string
  database: string
}
