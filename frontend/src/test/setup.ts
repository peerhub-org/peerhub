import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers and cleanup DOM after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
})

// Close server after all tests
afterAll(() => server.close())
