import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mockApi, mockStore } from '@/api/mock'
import type { Annotation, Document } from '@/api/types'
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

describe('mockApi', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Fully reset auth state by logging out
    mockApi.logout()
  })

  afterEach(() => {
    mockFetch.mockRestore()
    mockApi.logout()
  })

  // ── Auth ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('saves token and user to localStorage on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'jwt-abc', created_at: '2025-01-01T00:00:00Z' },
        }),
      )

      const result = await mockApi.login('alice', 'password123')

      expect(result.token).toBe('jwt-abc')
      expect(localStorage.getItem('auth_token')).toBe('jwt-abc')
      expect(localStorage.getItem('auth_user')).toContain('alice')
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Bad credentials' }, { status: 401 }))

      await expect(mockApi.login('alice', 'wrong')).rejects.toThrow('Bad credentials')
    })
  })

  describe('register', () => {
    it('creates user then logs in', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: { id: 2 } }))
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: { id: 2, username: 'bob', token: 'jwt-bob', created_at: '2025-01-01T00:00:00Z' },
          }),
        )

      const result = await mockApi.register('bob', 'secret')

      expect(result.username).toBe('bob')
      expect(result.token).toBe('jwt-bob')
    })

    it('throws if create fails', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 409, message: 'Username taken' }, { status: 200 }))

      await expect(mockApi.register('bob', 'secret')).rejects.toThrow('Username taken')
    })
  })

  describe('logout', () => {
    it('clears localStorage auth data', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'token', created_at: '2025-01-01T00:00:00Z' },
        }),
      )
      await mockApi.login('alice', 'pw')

      await mockApi.logout()

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('auth_user')).toBeNull()
    })
  })

  describe('updateUsername', () => {
    it('updates username in localStorage', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: { id: 1, username: 'alice', token: 'token', created_at: '2025-01-01T00:00:00Z' },
          }),
        )
        .mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: { id: 1 } }))

      await mockApi.login('alice', 'pw')
      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: { id: 1 } }))

      await mockApi.updateUsername('alice2')

      const user = JSON.parse(localStorage.getItem('auth_user')!)
      expect(user.username).toBe('alice2')
    })

    it('throws if not logged in', async () => {
      await expect(mockApi.updateUsername('alice2')).rejects.toThrow('请先登录')
    })
  })

  describe('updatePassword', () => {
    it('verifies current password then updates', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: { id: 1, username: 'alice', token: 'token', created_at: '2025-01-01T00:00:00Z' },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: { id: 1, username: 'alice', token: 'new-token', created_at: '2025-01-01T00:00:00Z' },
          }),
        )
        .mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: { id: 1 } }))

      await mockApi.login('alice', 'old')
      mockFetch.mockClear()
      mockFetch
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: { id: 1, username: 'alice', token: 'new-token', created_at: '2025-01-01T00:00:00Z' },
          }),
        )
        .mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: { id: 1 } }))

      await mockApi.updatePassword('old', 'new')
    })

    it('throws if not logged in', async () => {
      await expect(mockApi.updatePassword('old', 'new')).rejects.toThrow('请先登录')
    })
  })

  describe('getCurrentUser', () => {
    it('returns null when not logged in', () => {
      expect(mockApi.getCurrentUser()).toBeNull()
    })

    it('returns user after login', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'token', created_at: '2025-01-01T00:00:00Z' },
        }),
      )
      await mockApi.login('alice', 'pw')
      const user = mockApi.getCurrentUser()
      expect(user?.id).toBe(1)
      expect(user?.username).toBe('alice')
    })
  })

  describe('isLoggedIn', () => {
    it('returns false when not logged in', () => {
      expect(mockApi.isLoggedIn()).toBe(false)
    })

    it('returns true after login', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'token', created_at: '2025-01-01T00:00:00Z' },
        }),
      )
      await mockApi.login('alice', 'pw')
      expect(mockApi.isLoggedIn()).toBe(true)
    })
  })

  describe('mockStore.token', () => {
    it('reads token from localStorage', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, username: 'alice', token: 'my-token', created_at: '2025-01-01T00:00:00Z' },
        }),
      )
      await mockApi.login('alice', 'pw')
      expect(mockStore.token).toBe('my-token')
    })

    it('returns null when no token', () => {
      expect(mockStore.token).toBeNull()
    })
  })

  // ── Projects ──────────────────────────────────────────────────────────────

  describe('getProjects', () => {
    it('returns mapped project list', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            items: [
              {
                id: 1,
                name: 'Shiji',
                description: 'Historical',
                ownerId: 1,
                created_at: '2025-01-01',
                updated_at: '2025-01-02',
              },
            ],
            total: 1,
          },
        }),
      )

      const projects = await mockApi.getProjects()

      expect(projects).toHaveLength(1)
      expect(projects[0]!.name).toBe('Shiji')
      expect(projects[0]!.createdAt).toBe('2025-01-01')
    })
  })

  describe('getProject', () => {
    it('returns mapped project', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 5,
            name: 'Zuo Zhuan',
            description: null,
            ownerId: 1,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
            documentsCount: 3,
          },
        }),
      )

      const project = await mockApi.getProject(5)

      expect(project?.name).toBe('Zuo Zhuan')
      expect(project?.documentsCount).toBe(3)
    })

    it('throws on 404', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 404, message: 'Not found' }, { status: 200 }))

      await expect(mockApi.getProject(999)).rejects.toThrow('Not found')
    })
  })

  describe('createProject', () => {
    it('throws if not logged in', async () => {
      await expect(mockApi.createProject({ name: 'Test' })).rejects.toThrow('请先登录')
    })

    it('creates project with ownerId from auth state', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: { id: 7, username: 'alice', token: 'token', created_at: '2025-01-01T00:00:00Z' },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: {
              id: 10,
              name: 'New Project',
              description: 'Desc',
              ownerId: 7,
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
            },
          }),
        )

      await mockApi.login('alice', 'pw')
      mockFetch.mockClear()
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 10,
            name: 'New Project',
            description: 'Desc',
            ownerId: 7,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const project = await mockApi.createProject({ name: 'New Project', description: 'Desc' })
      expect(project.ownerId).toBe(7)
    })
  })

  describe('updateProject', () => {
    it('merges with existing project fields', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: {
              items: [
                { id: 1, name: 'Old Name', description: 'Old Desc', ownerId: 1, created_at: '2025-01-01', updated_at: '2025-01-01' },
              ],
              total: 1,
            },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            code: 0,
            message: 'ok',
            data: {
              id: 1,
              name: 'New Name',
              description: 'Old Desc',
              ownerId: 1,
              created_at: '2025-01-01',
              updated_at: '2025-02-01',
            },
          }),
        )

      const updated = await mockApi.updateProject(1, { name: 'New Name' })
      expect(updated.name).toBe('New Name')
    })

    it('throws if project not found', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ code: 404, message: 'Not found' }, { status: 200 }))
        .mockResolvedValueOnce(mockResponse({ code: 404, message: 'Not found' }, { status: 200 }))

      await expect(mockApi.updateProject(999, { name: 'x' })).rejects.toThrow('Not found')
    })
  })

  describe('deleteProject', () => {
    it('calls DELETE', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: null }))
      await expect(mockApi.deleteProject(1)).resolves.toBeUndefined()
    })
  })

  // ── Documents ────────────────────────────────────────────────────────────

  describe('getDocuments', () => {
    it('returns mapped document list', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            items: [
              { id: 1, project_id: 5, title: 'Doc 1', content: 'Content 1', created_at: '2025-01-01', updated_at: '2025-01-01' },
            ],
            total: 1,
          },
        }),
      )

      const docs = await mockApi.getDocuments(5)
      expect(docs).toHaveLength(1)
      expect(docs[0]!.title).toBe('Doc 1')
      expect(docs[0]!.projectId).toBe(5)
    })
  })

  describe('getDocument', () => {
    it('maps document fields correctly', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 3, project_id: 5, title: 'Chapter 3', content: '古文内容', created_at: '2025-01-01', updated_at: '2025-01-02' },
        }),
      )

      const doc = await mockApi.getDocument(3)
      expect(doc?.projectId).toBe(5)
      expect(doc?.title).toBe('Chapter 3')
    })

    it('maps annotations when included in response', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 3,
            project_id: 5,
            title: null,
            content: null,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
            annotations: [
              {
                id: 1,
                document_id: 3,
                entity: '孔子',
                entity_type: 'person',
                start_pos: 0,
                end_pos: 2,
                created_at: '2025-01-01',
                updated_at: '2025-01-01',
              },
            ],
          },
        }),
      )

      const doc = await mockApi.getDocument(3)
      const docWithAnnotations = doc as (Document & { annotations?: Annotation[] }) | undefined
      expect(docWithAnnotations?.annotations).toHaveLength(1)
      expect(docWithAnnotations?.annotations?.[0]!.entity).toBe('孔子')
    })
  })

  describe('createDocument', () => {
    it('creates and returns mapped document', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 7, project_id: 5, title: 'New Doc', content: 'New content', created_at: '2025-01-01', updated_at: '2025-01-01' },
        }),
      )

      const doc = await mockApi.createDocument(5, { title: 'New Doc', content: 'New content' })
      expect(doc.id).toBe(7)
      expect(doc.projectId).toBe(5)
    })
  })

  describe('updateDocument', () => {
    it('patches title and content', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, project_id: 5, title: 'Updated Title', content: 'Updated content', created_at: '2025-01-01', updated_at: '2025-02-01' },
        }),
      )

      const doc = await mockApi.updateDocument(1, { title: 'Updated Title', content: 'Updated content' })
      expect(doc.title).toBe('Updated Title')
    })
  })

  describe('deleteDocument', () => {
    it('calls DELETE', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: null }))
      await expect(mockApi.deleteDocument(1)).resolves.toBeUndefined()
    })
  })

  // ── Annotations ───────────────────────────────────────────────────────────

  describe('getAnnotations', () => {
    it('returns mapped annotation list', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            {
              id: 1,
              document_id: 3,
              entity: '孔子',
              entity_type: 'person',
              start_pos: 0,
              end_pos: 2,
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
            },
            {
              id: 2,
              document_id: 3,
              entity: '楚',
              entity_type: 'location',
              start_pos: 5,
              end_pos: 6,
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
            },
          ],
        }),
      )

      const annotations = await mockApi.getAnnotations(3)
      expect(annotations).toHaveLength(2)
      expect(annotations[0]!.entityType).toBe('person')
      expect(annotations[1]!.entityType).toBe('location')
    })
  })

  describe('createAnnotation', () => {
    it('sends entity_type snake_case and maps result', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 5,
            document_id: 3,
            entity: '君子',
            entity_type: 'concept',
            start_pos: 10,
            end_pos: 12,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      const ann = await mockApi.createAnnotation(3, {
        entity: '君子',
        entityType: 'concept',
        startPos: 10,
        endPos: 12,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ entity: '君子', entity_type: 'other', start_pos: 10, end_pos: 12 }),
        }),
      )
      expect(ann.entityType).toBe('other')
    })
  })

  describe('createAnnotationsBulk', () => {
    it('sends multiple annotations and returns mapped results', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { id: 6, document_id: 3, entity: '年', entity_type: 'time', start_pos: 0, end_pos: 1, created_at: '2025-01-01', updated_at: '2025-01-01' },
            { id: 7, document_id: 3, entity: '君子', entity_type: 'concept', start_pos: 2, end_pos: 4, created_at: '2025-01-01', updated_at: '2025-01-01' },
          ],
        }),
      )

      const annotations = await mockApi.createAnnotationsBulk(3, [
        { entity: '年', entityType: 'time', startPos: 0, endPos: 1 },
        { entity: '君子', entityType: 'concept', startPos: 2, endPos: 4 },
      ])

      expect(annotations).toHaveLength(2)
      expect(annotations[0]!.entityType).toBe('time')
      expect(annotations[1]!.entityType).toBe('other')
    })
  })

  describe('updateAnnotation', () => {
    it('patches annotation fields', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 1,
            document_id: 3,
            entity: '圣人',
            entity_type: 'other',
            start_pos: 0,
            end_pos: 2,
            created_at: '2025-01-01',
            updated_at: '2025-02-01',
          },
        }),
      )

      const ann = await mockApi.updateAnnotation(1, { entity: '圣人', entityType: 'other', startPos: 0, endPos: 2 })
      expect(ann.entity).toBe('圣人')
    })

    it('omits undefined fields in body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: {
            id: 1,
            document_id: 3,
            entity: '孔子',
            entity_type: 'person',
            start_pos: 0,
            end_pos: 2,
            created_at: '2025-01-01',
            updated_at: '2025-01-01',
          },
        }),
      )

      await mockApi.updateAnnotation(1, { entity: '孔子' })

      const [, options] = mockFetch.mock.calls[0]!
      const body = JSON.parse(options.body as string)
      expect(body.entity).toBe('孔子')
      expect(body.entity_type).toBeUndefined()
    })
  })

  describe('deleteAnnotation', () => {
    it('calls DELETE', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 0, message: 'ok', data: null }))
      await expect(mockApi.deleteAnnotation(1)).resolves.toBeUndefined()
    })
  })

  describe('autoAnnotate', () => {
    it('throws on document not found (business error)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ code: 404, message: 'Not found' }, { status: 200 }))

      await expect(mockApi.autoAnnotate(999)).rejects.toThrow('Not found')
    })

    it('returns empty array if document has no content', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { id: 1, project_id: 1, title: null, content: null, created_at: '', updated_at: '' },
        }),
      )

      const result = await mockApi.autoAnnotate(1)
      expect(result).toEqual([])
    })
  })

  // ── askQuestion ────────────────────────────────────────────────────────────

  describe('askQuestion', () => {
    it('returns translation placeholder for translation queries', async () => {
      const result = await mockApi.askQuestion('请翻译这段古文')
      expect(result).toContain('未接入')
    })

    it('returns default placeholder for other queries', async () => {
      const result = await mockApi.askQuestion('这段话是什么意思')
      expect(result).toContain('后端接口')
    })
  })

  // ── Entity type normalization ─────────────────────────────────────────────

  describe('Entity type normalization', () => {
    it('converts "concept" to "other" in toAnnotation', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            {
              id: 1,
              document_id: 3,
              entity: '君子',
              entity_type: 'concept',
              start_pos: 0,
              end_pos: 2,
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
            },
          ],
        }),
      )

      const annotations = await mockApi.getAnnotations(3)
      expect(annotations[0]!.entityType).toBe('other')
    })
  })
})
