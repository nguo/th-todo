import { Link, Navigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth/auth-context'

export function RegisterPage() {
  const { token, register } = useAuth()

  // Already signed in → skip the form.
  if (token) return <Navigate to="/" replace />

  return (
    <AuthForm
      title="Sign up"
      submitLabel="Create account"
      onSubmit={register}
      passwordAutoComplete="new-password"
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    />
  )
}
