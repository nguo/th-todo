import { useEffect, useState } from 'react'
import { api, type HealthResponse } from './api/client'

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<HealthResponse>('/health')
      .then(setHealth)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'system-ui' }}>
      <h1>Todo</h1>
      <p>Stack check — React (Vite) → .NET API → EF Core → SQLite</p>

      {error && <p style={{ color: 'crimson' }}>API error: {error}</p>}

      {!error && (
        <ul>
          <li>API status: <strong>{health?.status ?? 'checking…'}</strong></li>
          <li>Database: <strong>{health?.database ?? 'checking…'}</strong></li>
        </ul>
      )}
    </main>
  )
}

export default App
