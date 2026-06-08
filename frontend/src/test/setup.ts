// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)...
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// ...and unmounts/clears the DOM after every test. (Auto-cleanup only self-registers when Vitest
// globals are enabled, which they aren't here, so we wire it up explicitly.)
afterEach(() => {
  cleanup()
})
