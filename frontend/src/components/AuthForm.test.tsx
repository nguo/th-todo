import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AuthForm } from './AuthForm'
import { authError } from './authError'
import { ApiError } from '../api/client'

// The mapping is the logic; assert on the stable kind, never the displayed copy.
describe('authError', () => {
  it('maps 401 to invalid-credentials', () => {
    expect(authError(new ApiError(401, 'unauthorized'))?.kind).toBe('invalid-credentials')
  })

  it('maps 400 to length', () => {
    expect(authError(new ApiError(400, 'bad request'))?.kind).toBe('length')
  })

  it('passes other client errors through with their original message', () => {
    const mapped = authError(new ApiError(409, 'Username already taken'))
    expect(mapped?.kind).toBe('passthrough')
    expect(mapped?.message).toBe('Username already taken')
  })

  it('surfaces nothing for server errors', () => {
    expect(authError(new ApiError(500, 'boom'))?.kind).toBe('generic')
  })

  it('maps non-API errors to generic', () => {
    expect(authError(new Error('network down'))?.kind).toBe('generic')
  })
})

describe('AuthForm', () => {
  function renderForm(onSubmit: (u: string, p: string) => Promise<void>) {
    render(
      <AuthForm
        submitLabel="Log in"
        onSubmit={onSubmit}
        passwordAutoComplete="current-password"
        footer={null}
      />,
    )
  }

  async function submit(username = 'alice', password = 'password123') {
    const user = userEvent.setup()
    await user.type(screen.getByTestId('auth-username'), username)
    await user.type(screen.getByTestId('auth-password'), password)
    await user.click(screen.getByTestId('auth-submit'))
  }

  it('surfaces an alert when submit fails', async () => {
    renderForm(vi.fn().mockRejectedValue(new ApiError(401, 'unauthorized')))
    await submit()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('trims the username before handing it to onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm(onSubmit)
    await submit('  alice  ')
    expect(onSubmit).toHaveBeenCalledWith('alice', 'password123')
  })
})
