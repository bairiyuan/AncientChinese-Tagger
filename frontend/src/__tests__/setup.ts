import { beforeEach, afterEach, vi } from 'vitest'

// Mock fetch globally for all test files so they don't try real HTTP calls.
// Each test file should call mockFetch.mockReset() in its own beforeEach.
const mockFetch = vi.fn()
global.fetch = mockFetch

export { mockFetch }
