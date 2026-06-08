import { createContext, useContext } from 'react'

export interface AuthContextValue {
  token: string | null
  username: string | null
  // True while we validate a stored token on first load (avoids a login-page flash).
  initializing: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
