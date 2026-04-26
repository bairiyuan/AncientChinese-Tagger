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

describe('api/annotations', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listAnnotationsByDocument', () => {
    it('sends GET request with documentId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listAnnotationsByDocument } = await import('@/api/annotations')
      await listAnnotationsByDocument(5)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/5/annotations'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('returns Annotation array with snake_case fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            {
              id: 1,
              document_id: 5,
              entity: '孔子',
              entity_type: 'person',
              start_pos: 0,
              end_pos: 2,
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
            },
            {
              id: 2,
              document_id: 5,
              entity: '鲁',
              entity_type: 'location',
              start_pos: 5,
              end_pos: 6,
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
            },
          ],
        }),
      )

      const { listAnnotationsByDocument } = await import('@/api/annotations')
      const annotations = await listAnnotationsByDocument(5)

      expect(annotations).toHaveLength(2)
      expect(annotations[0]!.entity).toBe('孔子')
      expect(annotations[0]!.entity_type).toBe('person')
    })

    it('throws on business error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 404, message: 'Document not found' }, { status: 200 }),
      )

      const { listAnnotationsByDocument } = await import('@/api/annotations')
      await expect(listAnnotationsByDocument(999)).rejects.toThrow('Document not found')
    })
  })

  describe('createAnnotationInDocument', () => {
    it('sends POST with AnnotationCreate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 10,
            document_id: 5,
            entity: '君子',
            entity_type: 'concept',
            start_pos: 3,
            end_pos: 5,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { createAnnotationInDocument } = await import('@/api/annotations')
      await createAnnotationInDocument(5, {
        entity: '君子',
        entityType: 'concept',
        startPos: 3,
        endPos: 5,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/5/annotations'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns created Annotation', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 10,
            document_id: 5,
            entity: '仁',
            entity_type: 'concept',
            start_pos: 0,
            end_pos: 1,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { createAnnotationInDocument } = await import('@/api/annotations')
      const ann = await createAnnotationInDocument(5, {
        entity: '仁',
        entityType: 'concept',
        startPos: 0,
        endPos: 1,
      })

      expect(ann.id).toBe(10)
      expect(ann.entity).toBe('仁')
      expect(ann.entity_type).toBe('concept')
    })
  })

  describe('createAnnotationsBulk', () => {
    it('sends POST with array body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { id: 1, document_id: 5, entity: '年', entity_type: 'time', start_pos: 0, end_pos: 1, created_at: '2025-01-01', updated_at: '2025-01-01' },
            { id: 2, document_id: 5, entity: '月', entity_type: 'time', start_pos: 2, end_pos: 3, created_at: '2025-01-01', updated_at: '2025-01-01' },
          ],
        }),
      )

      const { createAnnotationsBulk } = await import('@/api/annotations')
      await createAnnotationsBulk(5, [
        { entity: '年', entityType: 'time', startPos: 0, endPos: 1 },
        { entity: '月', entityType: 'time', startPos: 2, endPos: 3 },
      ])

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/5/annotations/bulk'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns Annotation array', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { id: 1, document_id: 5, entity: '君子', entity_type: 'concept', start_pos: 0, end_pos: 2, created_at: '2025-01-01', updated_at: '2025-01-01' },
          ],
        }),
      )

      const { createAnnotationsBulk } = await import('@/api/annotations')
      const annotations = await createAnnotationsBulk(5, [
        { entity: '君子', entityType: 'concept', startPos: 0, endPos: 2 },
      ])

      expect(annotations).toHaveLength(1)
    })
  })

  describe('listAnnotations', () => {
    it('sends GET without params', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listAnnotations } = await import('@/api/annotations')
      await listAnnotations()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/annotations'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('sends query params for filtering', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listAnnotations } = await import('@/api/annotations')
      await listAnnotations({ projectId: 1, documentId: 5, entityType: 'person' })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('projectId=1')
      expect(url).toContain('documentId=5')
      expect(url).toContain('entityType=person')
    })

    it('omits undefined params', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { listAnnotations } = await import('@/api/annotations')
      await listAnnotations({ projectId: 1 })

      const [url] = mockFetch.mock.calls[0]!
      expect(url).toContain('projectId=1')
      expect(url).not.toContain('documentId')
      expect(url).not.toContain('entityType')
    })
  })

  describe('getAnnotation', () => {
    it('sends GET with annotationId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 7,
            document_id: 5,
            entity: '圣人',
            entity_type: 'other',
            start_pos: 0,
            end_pos: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { getAnnotation } = await import('@/api/annotations')
      const ann = await getAnnotation(7)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/annotations/7'),
        expect.objectContaining({ method: 'GET' }),
      )
      expect(ann.entity).toBe('圣人')
    })

    it('throws on 404', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 404, message: 'Annotation not found' }, { status: 200 }),
      )

      const { getAnnotation } = await import('@/api/annotations')
      await expect(getAnnotation(999)).rejects.toThrow('Annotation not found')
    })
  })

  describe('updateAnnotation', () => {
    it('sends PUT with AnnotationUpdate body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 7,
            document_id: 5,
            entity: '仁者',
            entity_type: 'concept',
            start_pos: 0,
            end_pos: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        }),
      )

      const { updateAnnotation } = await import('@/api/annotations')
      await updateAnnotation(7, {
        entity: '仁者',
        entityType: 'concept',
        startPos: 0,
        endPos: 2,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/annotations/7'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    it('returns updated Annotation', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 7,
            document_id: 5,
            entity: '仁者',
            entity_type: 'concept',
            start_pos: 0,
            end_pos: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        }),
      )

      const { updateAnnotation } = await import('@/api/annotations')
      const ann = await updateAnnotation(7, {
        entity: '仁者',
        entityType: 'concept',
        startPos: 0,
        endPos: 2,
      })

      expect(ann.entity).toBe('仁者')
    })
  })

  describe('patchAnnotation', () => {
    it('sends PATCH with AnnotationPatch body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 7,
            document_id: 5,
            entity: '仁',
            entity_type: 'concept',
            start_pos: 0,
            end_pos: 1,
            created_at: '2025-01-01',
            updated_at: '2025-01-02',
          },
        }),
      )

      const { patchAnnotation } = await import('@/api/annotations')
      await patchAnnotation(7, { entity: '仁' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/annotations/7'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('omits undefined fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 7,
            document_id: 5,
            entity: '仁',
            entity_type: 'person',
            start_pos: 0,
            end_pos: 1,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const { patchAnnotation } = await import('@/api/annotations')
      await patchAnnotation(7, { entity: '仁' })

      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.entity).toBe('仁')
      expect(body.entity_type).toBeUndefined()
      expect(body.start_pos).toBeUndefined()
    })
  })

  describe('deleteAnnotation', () => {
    it('sends DELETE with annotationId', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: null }),
      )

      const { deleteAnnotation } = await import('@/api/annotations')
      const result = await deleteAnnotation(7)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/annotations/7'),
        expect.objectContaining({ method: 'DELETE' }),
      )
      expect(result).toBeNull()
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 403, message: 'Forbidden' }, { status: 200 }),
      )

      const { deleteAnnotation } = await import('@/api/annotations')
      await expect(deleteAnnotation(7)).rejects.toThrow('Forbidden')
    })
  })
})
