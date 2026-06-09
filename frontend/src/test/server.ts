import { setupServer } from 'msw/node'

// No default handlers — each test declares its endpoints via `server.use(...)`. With
// `onUnhandledRequest: 'error'` (setup.ts), any un-stubbed request fails loudly.
export const server = setupServer()
