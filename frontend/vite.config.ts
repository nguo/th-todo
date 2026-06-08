import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// In dev, the browser only ever talks to the Vite dev server (default :5173).
// Requests to /api/* are proxied to the .NET API (:5080). This mirrors the
// production reverse proxy (HAProxy/ingress) so the app always calls a relative
// /api path and never deals with CORS.

export default defineConfig({
  plugins: [react()],
  server: {
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
