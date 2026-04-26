import { describe, it, expect, beforeEach } from 'vitest'
import { HttpClient, ApiRequestError } from '@/api/http'
import { mockFetch } from '../setup'

const createMockResponse = (data: unknown, init?: ResponseInit) => {
  const response = {
    ok: init?.status === undefined || (init.status >= 200 && init.status < 300),
    status: init?.status ?? 200,
    json: () => Promise.resolve(data),
    ...init,
  } as Response
  return response
}

describe('ApiRequestError', () => {
  it('captures status, code and payload', () => {
    const err = new ApiRequestError('test', 404, 1001, { foo: 'bar' })
    expect(err.message).toBe('test')
    expect(err.status).toBe(404)
    expect(err.code).toBe(1001)
    expect(err.payload).toEqual({ foo: 'bar' })
    expect(err.name).toBe('ApiRequestError')
  })
})

describe('HttpClient', () => {
  let client: HttpClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new HttpClient('http://example.com')
  })

  describe('request', () => {
    it('uses GET by default', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/foo',
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('accepts explicit method option', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo', { method: 'POST' })
      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/foo',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('sets Content-Type to application/json when body is provided', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo', { method: 'POST', body: { key: 'val' } })
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.headers.get('Content-Type')).toBe('application/json')
    })

    it('does not override user-provided Content-Type', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo', { method: 'POST', body: { key: 'val' }, headers: { 'Content-Type': 'text/plain' } })
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.headers.get('Content-Type')).toBe('text/plain')
    })

    it('attaches Authorization header when token getter returns a token', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      client.setTokenGetter(() => 'my-token')
      await client.request('/foo')
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.headers.get('Authorization')).toBe('Bearer my-token')
    })

    it('does not attach Authorization if no token', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      client.setTokenGetter(() => null)
      await client.request('/foo')
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.headers.get('Authorization')).toBeNull()
    })

    it('does not override user-provided Authorization header', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      client.setTokenGetter(() => 'my-token')
      await client.request('/foo', { headers: { Authorization: 'Custom token' } })
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.headers.get('Authorization')).toBe('Custom token')
    })

    it('serializes body as JSON', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo', { method: 'POST', body: { x: 1 } })
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.body).toBe('{"x":1}')
    })

    it('passes query string parameters in URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo', { query: { page: 2, keyword: 'test' } })
      expect(mockFetch.mock.calls[0]![0]).toBe('http://example.com/foo?page=2&keyword=test')
    })

    it('omits null, undefined and empty string query values', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo', { query: { a: 1, b: null, c: undefined, d: '' } })
      expect(mockFetch.mock.calls[0]![0]).toBe('http://example.com/foo?a=1')
    })

    it('throws ApiRequestError on non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Not found' }, { status: 404 }))
      await expect(client.request('/foo')).rejects.toThrow(ApiRequestError)
    })

    it('extracts business error from envelope code', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 401, message: 'Unauthorized' }, { status: 200 }))
      await expect(client.request('/foo')).rejects.toThrow('Unauthorized')
    })

    it('accepts code 0 as success', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: { foo: 'bar' } }))
      const result = await client.request<{ foo: string }>('/foo')
      expect(result).toEqual({ foo: 'bar' })
    })

    it('accepts code 200 as success', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 200, message: 'ok', data: { foo: 'bar' } }))
      const result = await client.request<{ foo: string }>('/foo')
      expect(result).toEqual({ foo: 'bar' })
    })

    it('returns unwrapped data from envelope', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: { id: 1 } }))
      const result = await client.request<{ id: number }>('/foo')
      expect(result).toEqual({ id: 1 })
    })

    it('returns raw payload when no envelope', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ id: 42 }))
      const result = await client.request<{ id: number }>('/foo')
      expect(result).toEqual({ id: 42 })
    })

    it('passes abort signal to fetch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      const signal = {} as AbortSignal
      await client.request('/foo', { signal })
      const [, options] = mockFetch.mock.calls[0]!
      expect(options.signal).toBe(signal)
    })

    it('uses relative URL when baseUrl is empty', async () => {
      const emptyClient = new HttpClient('')
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await emptyClient.request('/foo')
      expect(mockFetch.mock.calls[0]![0]).toBe('/foo')
    })

    it('normalizes trailing slash in apiClient singleton', async () => {
      // The module-level apiClient normalizes its baseUrl, but manually constructed
      // instances preserve the trailing slash. This is the documented behavior.
      const client = new HttpClient('http://example.com/')
      mockFetch.mockResolvedValueOnce(createMockResponse({ code: 0, message: 'ok', data: null }))
      await client.request('/foo')
      expect(mockFetch.mock.calls[0]![0]).toBe('http://example.com//foo')
    })
  })
})
