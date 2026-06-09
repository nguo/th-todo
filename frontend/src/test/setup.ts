// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)...
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'

// MSW intercepts at the fetch layer (handlers keyed by method+path). Fail on any request that
// isn't explicitly stubbed so stray/real network calls surface as test failures.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })

  // The app fetches the relative `/api` base. jsdom's Node fetch can't parse relative URLs, so
  // resolve leading-'/' paths against jsdom's location — the SAME origin MSW uses to resolve its
  // path-only handlers, so both sides agree. Wrap after listen() so this sits outermost
  // (normalize → MSW interceptor). Test-only; production is untouched.
  const intercepted = globalThis.fetch
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    intercepted(
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, globalThis.location.href).href
        : input,
      init,
    )) as typeof fetch
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
})

afterAll(() => server.close())
