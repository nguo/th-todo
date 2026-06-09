// Adds jest-dom matchers to Vitest's `expect` (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'

// MSW intercepts at the fetch layer (handlers keyed by method+path). Fail on any un-stubbed
// request so stray/real network calls surface as failures.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })

  // The app fetches the relative `/api` base, but jsdom's Node fetch can't parse relative URLs.
  // Resolve leading-'/' paths against jsdom's location — the same origin MSW uses for its
  // path-only handlers, so both agree. Wrap after listen() so this sits outermost (normalize →
  // MSW interceptor). Test-only; production untouched.
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
