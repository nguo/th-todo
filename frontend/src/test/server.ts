import { setupServer } from 'msw/node'

// No default handlers — each test declares the endpoints it needs via `server.use(...)`.
// Combined with `onUnhandledRequest: 'error'` (see setup.ts), any un-stubbed request fails loudly.
export const server = setupServer()
