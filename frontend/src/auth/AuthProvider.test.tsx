import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { tokenStore } from '../api/client'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './auth-context'

// Surfaces the auth context state as text + buttons to drive login/logout.
function Harness() {
  const { token, username, initializing, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="state">
        {initializing ? 'init' : `${token ?? 'none'}:${username ?? 'none'}`}
      </span>
      <button data-testid="login" onClick={() => void login('alice', 'pw')}>
        login
      </button>
      <button data-testid="logout" onClick={logout}>
        logout
      </button>
    </div>
  )
}

const renderHarness = () =>
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  )

afterEach(() => tokenStore.clear())

describe('AuthProvider', () => {
  it('starts unauthenticated when no token is stored', async () => {
    renderHarness()
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('none:none'))
  })

  it('stores token and username on login', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ token: 'tok-1', username: 'alice' })))

    renderHarness()
    await user.click(screen.getByTestId('login'))

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('tok-1:alice'))
    expect(tokenStore.get()).toBe('tok-1')
  })

  it('clears token and username on logout', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ token: 'tok-1', username: 'alice' })))

    renderHarness()
    await user.click(screen.getByTestId('login'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('tok-1:alice'))

    await user.click(screen.getByTestId('logout'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('none:none'))
    expect(tokenStore.get()).toBeNull()
  })

  it('validates a stored token on load and recovers the username', async () => {
    tokenStore.set('stored')
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ username: 'bob' })))

    renderHarness()
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('stored:bob'))
  })

  it('clears a stored token when /me returns 401', async () => {
    tokenStore.set('stale')
    server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })))

    renderHarness()
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('none:none'))
    expect(tokenStore.get()).toBeNull()
  })
})
