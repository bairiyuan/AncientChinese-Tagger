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

describe('api/projects', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listProjects', () => {
    it('sends GET request', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listProjects } = await import('@/api/projects')
      await listProjects()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('returns Project array with snake_case fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { id: 1, name: '论语集注', description: '朱熹注', owner_id: 1, created_at: '2025-01-01', updated_at: '2025-01-01' },
            { id: 2, name: '孟子集注', description: null, owner_id: 1, created_at: '2025-01-01', updated_at: '2025-01-01' },
          ],
        }),
      )

      const { listProjects } = await import('@/api/projects')
      const projects = await listProjects()

      expect(projects).toHaveLength(2)
      expect(projects[0]!.name).toBe('论语集注')
      expect(projects[1]!.name).toBe('孟子集注')
    })

    it('sends ownerId query param when provided', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listProjects } = await import('@/api/projects')
      await listProjects({ ownerId: 5 })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('ownerId=5')
    })
  })

  describe('getProject', () => {
    it('sends GET with projectId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 3,
            name: '礼记',
            description: '儒家经典',
            owner_id: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
            documents_count: 10,
          },
        }),
      )

      const { getProject } = await import('@/api/projects')
      const project = await getProject(3)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/3'),
        expect.objectContaining({ method: 'GET' }),
      )
      expect(project.name).toBe('礼记')
    })

    it('throws on 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 404, message: 'Project not found' }, { status: 200 }),
      )

      const { getProject } = await import('@/api/projects')
      await expect(getProject(999)).rejects.toThrow('Project not found')
    })
  })

  describe('createProject', () => {
    it('sends POST with ProjectCreate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 10,
            name: '尚书',
            description: '上古之书',
            owner_id: 1,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { createProject } = await import('@/api/projects')
      await createProject({ name: '尚书', description: '上古之书', ownerId: 1 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns created Project', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 10,
            name: '春秋',
            description: '鲁国史记',
            owner_id: 1,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { createProject } = await import('@/api/projects')
      const project = await createProject({ name: '春秋', description: '鲁国史记', ownerId: 1 })

      expect(project.id).toBe(10)
      expect(project.name).toBe('春秋')
    })
  })

  describe('updateProject', () => {
    it('sends PUT with ProjectUpdate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 3,
            name: '礼记（新注）',
            description: '新注本',
            owner_id: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        }),
      )

      const { updateProject } = await import('@/api/projects')
      await updateProject(3, { name: '礼记（新注）', description: '新注本', ownerId: 2 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/3'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    it('returns updated Project', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 3,
            name: '周易',
            description: '易经',
            owner_id: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        }),
      )

      const { updateProject } = await import('@/api/projects')
      const project = await updateProject(3, { name: '周易', description: '易经', ownerId: 2 })

      expect(project.name).toBe('周易')
    })
  })

  describe('patchProject', () => {
    it('sends PATCH with ProjectPatch body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 3,
            name: '礼记（补）',
            description: null,
            owner_id: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        }),
      )

      const { patchProject } = await import('@/api/projects')
      await patchProject(3, { name: '礼记（补）' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/3'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('omits undefined fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 3,
            name: '礼记',
            description: '儒家经典',
            owner_id: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { patchProject } = await import('@/api/projects')
      await patchProject(3, { name: '礼记' })

      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.name).toBe('礼记')
      expect(body.description).toBeUndefined()
      expect(body.ownerId).toBeUndefined()
    })
  })

  describe('deleteProject', () => {
    it('sends DELETE with projectId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: null }),
      )

      const { deleteProject } = await import('@/api/projects')
      const result = await deleteProject(3)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/3'),
        expect.objectContaining({ method: 'DELETE' }),
      )
      expect(result).toBeNull()
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 403, message: 'Forbidden' }, { status: 200 }),
      )

      const { deleteProject } = await import('@/api/projects')
      await expect(deleteProject(3)).rejects.toThrow('Forbidden')
    })
  })
})
