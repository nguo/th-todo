import { useState, type SyntheticEvent, type ReactNode } from 'react'
import { ApiError } from '../api/client'

interface AuthFormProps {
  submitLabel: string
  // Resolves on success; rejects (typically ApiError) on failure so we can show the message.
  onSubmit: (username: string, password: string) => Promise<void>
  passwordAutoComplete: 'current-password' | 'new-password'
  footer: ReactNode
}

// Shared username/password form for both login and register.
export function AuthForm({ submitLabel, onSubmit, passwordAutoComplete, footer }: AuthFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSubmit(username.trim(), password)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Invalid login credentials. Please try again.')
        } else if (err.status === 400) {
          setError('Please check your username or password length')
        } else if (err.status < 500) {
          setError(err.message)
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card auth-form" onSubmit={submit}>
      <label>
        Username
        <input
          minLength={3}
          maxLength={30}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          data-testid="auth-username"
          autoFocus
          required
        />
      </label>

      <label>
        Password
        <input
          minLength={8}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={passwordAutoComplete}
          data-testid="auth-password"
          required
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" data-testid="auth-submit" disabled={busy}>
        {busy ? 'Please wait…' : submitLabel}
      </button>

      <p className="auth-footer">{footer}</p>
    </form>
  )
}
