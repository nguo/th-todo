import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// In dev the browser only talks to the Vite dev server (:5173); /api/* is proxied to the API
// (:5080). Mirrors the prod reverse proxy so the app always calls a relative /api path, no CORS.

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      // ws: permits the Vite HMR WebSocket in dev; prod CSP (set at the reverse proxy) omits it
      'Content-Security-Policy':
        "default-src 'self'; connect-src 'self' ws:; frame-ancestors 'none'",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
