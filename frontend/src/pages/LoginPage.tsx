import { Link } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth/auth-context'

export function LoginPage() {
  const { login } = useAuth()

  return (
    <AuthForm
      submitLabel="Log in"
      onSubmit={login}
      passwordAutoComplete="current-password"
      footer={<>No account? <Link to="/register">Sign up</Link></>}
    />
  )
}
