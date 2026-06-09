import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { tokenStore } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import { LoginPage } from './LoginPage'

afterEach(() => tokenStore.clear())

// Fill in and submit the login form. The per-test server.use(...) decides the response.
async function submitLogin(username: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByTestId('auth-username'), username)
  await user.type(screen.getByTestId('auth-password'), password)
  await user.click(screen.getByTestId('auth-submit'))
}

beforeEach(() => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  )
})

describe('LoginPage', () => {
  it('stores the returned token on successful login', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ token: 'tok-123', username: 'alice' })))
    await submitLogin('alice', 'password123')
    await waitFor(() => expect(tokenStore.get()).toBe('tok-123'))
  })

  it('shows an error alert when login fails', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ error: 'nope' }, { status: 401 })))
    await submitLogin('alice', 'foo')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
