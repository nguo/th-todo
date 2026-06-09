import { Link } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth/auth-context'

export function RegisterPage() {
  const { register } = useAuth()

  return (
    <AuthForm
      submitLabel="Create account"
      onSubmit={register}
      passwordAutoComplete="new-password"
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
      enforceLength={true}
    />
  )
}
