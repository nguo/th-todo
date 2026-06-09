import { ApiError } from '../api/client'

// Stable identifiers for each auth failure case — tests assert on these, not the copy.
export type AuthErrorKind = 'invalid-credentials' | 'length' | 'passthrough' | 'generic'

export interface AuthError {
  kind: AuthErrorKind
  message: string
}

// Maps a thrown auth error to a kind + user-facing message.
// Returns null when there's nothing to surface (5xx — see AuthForm 5xx gap).
export function authError(err: unknown): AuthError | null {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return { kind: 'invalid-credentials', message: 'Invalid login credentials. Please try again.' }
    }
    if (err.status === 400) {
      return { kind: 'length', message: 'Please check your username or password length' }
    }
    if (err.status < 500) {
      return { kind: 'passthrough', message: err.message }
    }
    return { kind: 'generic', message: 'Something went wrong. Please try again.' }
  }
  return { kind: 'generic', message: 'Something went wrong. Please try again.' }
}
