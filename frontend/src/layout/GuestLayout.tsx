import { Navigate, Outlet } from 'react-router-dom'
import { Wordmark } from '../components/Wordmark'
import { useAuth } from '../auth/auth-context'

export function GuestLayout() {
  const { token } = useAuth()
  
  // Already signed in → skip the form
    if (token) return <Navigate to="/" replace />

  return (
    <div className="screen-center guest-layout">
      <Wordmark size="hero" as="h1" />
      <div className="lead">Turn plans into progress</div>
      <Outlet />
    </div>
  )
}
