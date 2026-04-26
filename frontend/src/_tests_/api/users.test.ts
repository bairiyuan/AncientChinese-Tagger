import { describe, it, expect, beforeEach } from 'vitest'
import { mockFetch } from '../setup'

const mockResponse = (data: unknown, init?: ResponseInit) => {
  const response = {
    ok: init?.status === undefined || (init.status >= 200 && init.status < 300),
    status: init?.status ?? 200,
    json: () => Promise.resolve(data),
    ...init,
  } as Response
  return response
}

describe('api/users', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listUsers', () => {
    it('sends GET request', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: { items: [], total: 0 } }),
      )

      const { listUsers } = await import('@/api/users')
      await listUsers()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('returns ListResult with User array', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            items: [
              { id: 1, username: 'alice', password: '', created_at: '2025-01-01', updated_at: '2025-01-01' },
              { id: 2, username: 'bob', password: '', created_at: '2025-01-01', updated_at: '2025-01-01' },
            ],
            total: 2,
          },
        }),
      )

      const { listUsers } = await import('@/api/users')
      const result = await listUsers()

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.items[0]!.username).toBe('alice')
    })

    it('sends pagination params', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: { items: [], total: 0 } }),
      )

      const { listUsers } = await import('@/api/users')
      await listUsers({ page: 2, pageSize: 20 })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('page=2')
      expect(url).toContain('pageSize=20')
    })

    it('omits undefined pagination params', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: { items: [], total: 0 } }),
      )

      const { listUsers } = await import('@/api/users')
      await listUsers({ page: 1 })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('page=1')
      expect(url).not.toContain('pageSize')
    })
  })

  describe('getUser', () => {
    it('sends GET with userId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 5, username: 'charlie', password: '', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { getUser } = await import('@/api/users')
      const user = await getUser(5)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/5'),
        expect.objectContaining({ method: 'GET' }),
      )
      expect(user.username).toBe('charlie')
    })

    it('throws on 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 404, message: 'User not found' }, { status: 200 }),
      )

      const { getUser } = await import('@/api/users')
      await expect(getUser(999)).rejects.toThrow('User not found')
    })
  })

  describe('createUser', () => {
    it('sends POST with UserCreate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 10, username: 'dave', password: '', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { createUser } = await import('@/api/users')
      await createUser({ username: 'dave', password: 'secret123' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns created User', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 10, username: 'eve', password: '', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { createUser } = await import('@/api/users')
      const user = await createUser({ username: 'eve', password: 'pass' })

      expect(user.id).toBe(10)
      expect(user.username).toBe('eve')
    })

    it('throws on username conflict', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 409, message: 'Username already exists' }, { status: 200 }),
      )

      const { createUser } = await import('@/api/users')
      await expect(createUser({ username: 'alice', password: 'pass' })).rejects.toThrow('Username already exists')
    })
  })

  describe('updateUser', () => {
    it('sends PUT with UserUpdate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 5, username: 'charlie2', password: 'newpass', created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const { updateUser } = await import('@/api/users')
      await updateUser(5, { username: 'charlie2', password: 'newpass' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/5'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    it('returns updated User', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 5, username: 'charlie3', password: '', created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const { updateUser } = await import('@/api/users')
      const user = await updateUser(5, { username: 'charlie3', password: '' })

      expect(user.username).toBe('charlie3')
    })
  })

  describe('patchUser', () => {
    it('sends PATCH with UserPatch body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 5, username: 'charlie-patched', password: '', created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const { patchUser } = await import('@/api/users')
      await patchUser(5, { username: 'charlie-patched' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/5'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('omits undefined fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 5, username: 'charlie', password: '', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { patchUser } = await import('@/api/users')
      await patchUser(5, { username: 'charlie' })

      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.username).toBe('charlie')
      expect(body.password).toBeUndefined()
    })
  })

  describe('deleteUser', () => {
    it('sends DELETE with userId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: null }),
      )

      const { deleteUser } = await import('@/api/users')
      const result = await deleteUser(5)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/5'),
        expect.objectContaining({ method: 'DELETE' }),
      )
      expect(result).toBeNull()
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 403, message: 'Forbidden' }, { status: 200 }),
      )

      const { deleteUser } = await import('@/api/users')
      await expect(deleteUser(5)).rejects.toThrow('Forbidden')
    })
  })

  describe('login', () => {
    it('sends POST with LoginPayload body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'jwt-xyz', created_at: '2025-01-01' },
        }),
      )

      const { login } = await import('@/api/users')
      await login({ username: 'alice', password: 'secret' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/login'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns LoginResult with token', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'jwt-abc', created_at: '2025-01-01' },
        }),
      )

      const { login } = await import('@/api/users')
      const result = await login({ username: 'alice', password: 'secret' })

      expect(result.token).toBe('jwt-abc')
      expect(result.username).toBe('alice')
    })

    it('throws on invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 401, message: 'Invalid credentials' }, { status: 200 }),
      )

      const { login } = await import('@/api/users')
      await expect(login({ username: 'alice', password: 'wrong' })).rejects.toThrow('Invalid credentials')
    })
  })
})
