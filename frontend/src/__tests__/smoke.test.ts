import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/api'

describe('smoke', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('works', () => {
    expect(1 + 1).toBe(2)
  })

  it('apiClient is configured', () => {
    expect(apiClient).toBeTruthy()
  })

  it('request can be mocked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, message: 'success', data: { ok: true } }),
    } as unknown as Response)

    const result = await apiClient.request<{ ok: boolean }>('/api/ping')
    expect(result).toEqual({ ok: true })
  })
})
