import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { api, ApiError, setUnauthorizedHandler, tokenStore } from './client'

afterEach(() => {
  tokenStore.clear()
  setUnauthorizedHandler(() => {})
})

describe('api client', () => {
  it('attaches the bearer token only when one is stored', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get('/api/ping', ({ request }) => {
        seen.push(request.headers.get('authorization'))
        return HttpResponse.json({ ok: true })
      }),
    )

    tokenStore.set('tok-123')
    await api.get('/ping')
    tokenStore.clear()
    await api.get('/ping')

    expect(seen).toEqual(['Bearer tok-123', null])
  })

  it('on 401 clears the token, calls the unauthorized handler, and throws ApiError(401)', async () => {
    tokenStore.set('tok')
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    server.use(http.get('/api/secure', () => new HttpResponse(null, { status: 401 })))

    await expect(api.get('/secure')).rejects.toMatchObject({ status: 401 })
    expect(tokenStore.get()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('surfaces the error message from the response body', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ error: 'Username is already taken.' }, { status: 409 }),
      ),
    )

    const err = await api.post('/auth/register', {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(409)
    expect((err as ApiError).message).toBe('Username is already taken.')
  })

  it('resolves undefined for 204 No Content', async () => {
    server.use(http.delete('/api/things/1', () => new HttpResponse(null, { status: 204 })))
    await expect(api.del('/things/1')).resolves.toBeUndefined()
  })
})
