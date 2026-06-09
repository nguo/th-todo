import { useState, type SyntheticEvent, type ReactNode } from 'react'
import { ApiError } from '../api/client'

interface AuthFormProps {
  title: string
  submitLabel: string
  // Resolves on success; rejects (typically ApiError) on failure so we can show the message.
  onSubmit: (username: string, password: string) => Promise<void>
  passwordAutoComplete: 'current-password' | 'new-password'
  footer: ReactNode
}

// Shared username/password form for both login and register.
export function AuthForm({ title, submitLabel, onSubmit, passwordAutoComplete, footer }: AuthFormProps) {
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
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen-center">
      <form className="card auth-form" onSubmit={submit}>
        <h1>{title}</h1>

        <label>
          Username
          <input
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
    </div>
  )
}
