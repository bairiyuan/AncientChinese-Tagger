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

describe('api/documents', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listDocumentsByProject', () => {
    it('sends GET request with projectId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listDocumentsByProject } = await import('@/api/documents')
      await listDocumentsByProject(3)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/3/documents'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('returns Document array with snake_case fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { id: 1, project_id: 3, title: '学而', content: '子曰', created_at: '2025-01-01', updated_at: '2025-01-01' },
            { id: 2, project_id: 3, title: '为政', content: '子曰', created_at: '2025-01-01', updated_at: '2025-01-01' },
          ],
        }),
      )

      const { listDocumentsByProject } = await import('@/api/documents')
      const docs = await listDocumentsByProject(3)

      expect(docs).toHaveLength(2)
      expect(docs[0]!.title).toBe('学而')
      expect(docs[1]!.title).toBe('为政')
    })
  })

  describe('createDocumentInProject', () => {
    it('sends POST with DocumentCreate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 5, project_id: 3, title: '八佾', content: '孔子谓季氏', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { createDocumentInProject } = await import('@/api/documents')
      await createDocumentInProject(3, { title: '八佾', content: '孔子谓季氏' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/3/documents'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns created Document', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 10, project_id: 3, title: '里仁', content: '里仁为美', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { createDocumentInProject } = await import('@/api/documents')
      const doc = await createDocumentInProject(3, { title: '里仁', content: '里仁为美' })

      expect(doc.id).toBe(10)
      expect(doc.title).toBe('里仁')
    })
  })

  describe('listDocuments', () => {
    it('sends GET without params', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listDocuments } = await import('@/api/documents')
      await listDocuments()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('sends query params for projectId and keyword', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listDocuments } = await import('@/api/documents')
      await listDocuments({ projectId: 3, keyword: '仁' })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('projectId=3')
      expect(url).toContain('keyword=')
    })

    it('omits undefined params', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listDocuments } = await import('@/api/documents')
      await listDocuments({ keyword: '君子' })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('keyword=')
      expect(url).not.toContain('projectId')
    })
  })

  describe('getDocument', () => {
    it('sends GET with documentId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 7, project_id: 3, title: '公冶长', content: '子谓公冶长', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { getDocument } = await import('@/api/documents')
      const doc = await getDocument(7)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/7'),
        expect.objectContaining({ method: 'GET' }),
      )
      expect(doc.title).toBe('公冶长')
    })

    it('throws on 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 404, message: 'Document not found' }, { status: 200 }),
      )

      const { getDocument } = await import('@/api/documents')
      await expect(getDocument(999)).rejects.toThrow('Document not found')
    })
  })

  describe('updateDocument', () => {
    it('sends PUT with DocumentUpdate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 7, project_id: 3, title: '公冶长（新）', content: '更新内容', created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const { updateDocument } = await import('@/api/documents')
      await updateDocument(7, { title: '公冶长（新）', content: '更新内容' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/7'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    it('returns updated Document', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 7, project_id: 3, title: '先进', content: '子曰', created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const { updateDocument } = await import('@/api/documents')
      const doc = await updateDocument(7, { title: '先进', content: '子曰' })

      expect(doc.title).toBe('先进')
    })
  })

  describe('patchDocument', () => {
    it('sends PATCH with DocumentPatch body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 7, project_id: 3, title: '先进（补）', content: null, created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const { patchDocument } = await import('@/api/documents')
      await patchDocument(7, { title: '先进（补）' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/7'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('omits undefined fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 7, project_id: 3, title: '先进', content: '子曰', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const { patchDocument } = await import('@/api/documents')
      await patchDocument(7, { title: '先进' })

      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.title).toBe('先进')
      expect(body.content).toBeUndefined()
    })
  })

  describe('deleteDocument', () => {
    it('sends DELETE with documentId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: null }),
      )

      const { deleteDocument } = await import('@/api/documents')
      const result = await deleteDocument(7)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/7'),
        expect.objectContaining({ method: 'DELETE' }),
      )
      expect(result).toBeNull()
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 403, message: 'Forbidden' }, { status: 200 }),
      )

      const { deleteDocument } = await import('@/api/documents')
      await expect(deleteDocument(7)).rejects.toThrow('Forbidden')
    })
  })
})
