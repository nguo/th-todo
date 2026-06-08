// Typed fetch wrapper.
//
// All requests use a relative `/api` base (Vite proxies it in dev, the reverse proxy in
// prod → same-origin, no CORS). A JWT, when present, is attached as a Bearer token; a 401
// clears it and invokes the registered unauthorized handler so the app can return to login.
const API_BASE = '/api'
const TOKEN_KEY = 'todo_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Called when any request comes back 401 (token missing/expired). The auth layer registers a
// handler here; kept as a callback so this module stays decoupled from the React/auth code.
let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = tokenStore.get()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (res.status === 401) {
    tokenStore.clear()
    onUnauthorized()
    throw new ApiError(401, 'Your session has expired. Please log in again.')
  }

  if (!res.ok) {
    // The API returns `{ error }` for handled failures; fall back to the status text.
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content has no body to parse.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

const body = (b: unknown) => (b === undefined ? undefined : JSON.stringify(b))

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, b?: unknown) => request<T>(path, { method: 'POST', body: body(b) }),
  put: <T>(path: string, b?: unknown) => request<T>(path, { method: 'PUT', body: body(b) }),
  del: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ---- Response types (mirror the API responses) ----

export interface AuthResponse {
  token: string
  username: string
}

export interface TodoList {
  id: string
  name: string
}

export interface TodoItem {
  id: string
  listId: string
  title: string
  isCompleted: boolean
  position: number
  createdAt: string
  updatedAt: string
}
