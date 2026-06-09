import { useState, type SyntheticEvent, type ReactNode } from 'react'
import { authError, type AuthError } from './authError'

interface AuthFormProps {
  submitLabel: string,
  // Resolves on success; rejects (usually ApiError) on failure so we show the message.
  onSubmit: (username: string, password: string) => Promise<void>
  passwordAutoComplete: 'current-password' | 'new-password'
  footer: ReactNode,
  enforceLength?: boolean
}

// Shared username/password form for login and register.
export function AuthForm({ submitLabel, onSubmit, passwordAutoComplete, footer, enforceLength = false }: AuthFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<AuthError | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSubmit(username.trim(), password)
    } catch (err) {
      setError(authError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card auth-form" onSubmit={submit}>
      <label>
        Username
        <input
          minLength={enforceLength ? 3 : undefined}
          maxLength={enforceLength ? 30 : undefined}
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
          minLength={enforceLength ? 8 : undefined}
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
          {error.message}
        </p>
      )}

      <button type="submit" data-testid="auth-submit" disabled={busy}>
        {busy ? 'Please wait…' : submitLabel}
      </button>

      <p className="auth-footer">{footer}</p>
    </form>
  )
}
