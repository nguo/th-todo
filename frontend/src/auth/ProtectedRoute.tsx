import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'

// Gates a route: shows a brief loading state while a stored token is validated, then either
// renders the page or redirects to login.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, initializing } = useAuth()
  if (initializing) return <div className="screen-center muted">Loading…</div>
  return token ? <>{children}</> : <Navigate to="/login" replace />
}
