import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, tokenStore, type AuthResponse } from '../api/client'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get())
  const [username, setUsername] = useState<string | null>(null)
  // Only "initializing" if there's a stored token to validate; otherwise nothing to wait for.
  const [initializing, setInitializing] = useState(() => tokenStore.get() !== null)

  // Whenever a request reports the session is no longer valid, drop the auth state so the
  // router sends the user back to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setUsername(null)
    })
  }, [])

  // On first load, if a token is stored, confirm it's still valid and recover the username.
  // (When there's no token, `initializing` already starts false — nothing to do.)
  useEffect(() => {
    let active = true
    if (!tokenStore.get()) return
    api
      .get<{ username: string }>('/auth/me')
      .then((r) => {
        if (active) setUsername(r.username)
      })
      .catch(() => {
        /* a 401 already cleared the token via the unauthorized handler */
      })
      .finally(() => {
        if (active) setInitializing(false)
      })
    return () => {
      active = false
    }
  }, [])

  const applyAuth = useCallback((r: AuthResponse) => {
    tokenStore.set(r.token)
    setToken(r.token)
    setUsername(r.username)
  }, [])

  const login = useCallback(
    async (u: string, p: string) => {
      applyAuth(await api.post<AuthResponse>('/auth/login', { username: u, password: p }))
    },
    [applyAuth],
  )

  const register = useCallback(
    async (u: string, p: string) => {
      applyAuth(await api.post<AuthResponse>('/auth/register', { username: u, password: p }))
    },
    [applyAuth],
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    setUsername(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, username, initializing, login, register, logout }),
    [token, username, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
