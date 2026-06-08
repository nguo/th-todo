import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock only the api methods; keep the real ApiError / tokenStore / setUnauthorizedHandler that
// AuthProvider relies on. This drives the real login flow rather than stubbing useAuth.
vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() } }
})

import { LoginPage } from './LoginPage'
import { AuthProvider } from '../auth/AuthProvider'
import { api, ApiError, tokenStore } from '../api/client'

// Address-based POST stub: responds by request path, not call order.
function stubPost(handlers: Record<string, () => Promise<unknown>>) {
  vi.mocked(api.post).mockImplementation((path: string) =>
    (handlers[path] ?? (() => Promise.reject(new Error(`unexpected POST ${path}`))))() as never,
  )
}

const renderPage = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  )

beforeEach(() => {
  vi.mocked(api.post).mockReset()
  tokenStore.clear() // no stored token → AuthProvider skips its /auth/me check
})

describe('LoginPage', () => {
  it('posts the entered credentials and stores the returned token', async () => {
    const user = userEvent.setup()
    stubPost({ '/auth/login': () => Promise.resolve({ token: 'tok-123', username: 'alice' }) })
    renderPage()

    await user.type(screen.getByTestId('auth-username'), 'alice')
    await user.type(screen.getByTestId('auth-password'), 'secret123')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => expect(tokenStore.get()).toBe('tok-123'))
    expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'alice', password: 'secret123' })
  })

  it('shows an error alert when login fails', async () => {
    const user = userEvent.setup()
    // Message is a test fixture, not asserted on — we only check that an error surfaces.
    stubPost({ '/auth/login': () => Promise.reject(new ApiError(401, 'login failed (test)')) })
    renderPage()

    await user.type(screen.getByTestId('auth-username'), 'alice')
    await user.type(screen.getByTestId('auth-password'), 'wrong')
    await user.click(screen.getByTestId('auth-submit'))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
