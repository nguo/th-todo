import { Link, Navigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth/auth-context'

export function LoginPage() {
  const { token, login } = useAuth()

  // Already signed in → skip the form.
  if (token) return <Navigate to="/" replace />

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      onSubmit={login}
      passwordAutoComplete="current-password"
      footer={<>No account? <Link to="/register">Sign up</Link></>}
    />
  )
}
