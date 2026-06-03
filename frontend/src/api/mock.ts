import { apiClient, ApiRequestError } from '@/api/http'
import type { Annotation, Document, EntityType, LoginResult, Project, User } from '@/api/types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

type ApiProject = {
  id: number
  name: string
  description: string | null
  ownerId: number
  created_at: string
  updated_at: string
  documentsCount?: number
  annotationsCount?: number
  entityDistribution?: Record<string, number>
}

type ApiDocument = {
  id: number
  project_id: number
  title: string | null
  content: string | null
  parsed_result?: any
  tokenized_result?: any
  created_at: string
  updated_at: string
}

type ApiDocumentWithAnnotations = ApiDocument & {
  annotations?: ApiAnnotation[]
}

type ApiAnnotation = {
  id: number
  document_id: number
  entity: string
  entity_type: string
  start_pos: number | null
  end_pos: number | null
  created_at: string
  updated_at: string
}

type PagedResult<T> = {
  items: T[]
  total: number
}

type AuthUser = Pick<User, 'id' | 'username' | 'createdAt'>

const normalizeEntityType = (type: string): EntityType =>
  type === 'concept' ? 'other' : (type as EntityType)

const toProject = (item: ApiProject): Project => ({
  id: item.id,
  name: item.name,
  description: item.description,
  ownerId: item.ownerId,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  documentsCount: item.documentsCount || 0,
  annotationsCount: item.annotationsCount || 0,
  entityDistribution: item.entityDistribution || {},
})

const toDocument = (item: ApiDocument): Document => ({
  id: item.id,
  projectId: item.project_id,
  title: item.title,
  content: item.content,
  parsed_result: item.parsed_result,
  tokenized_result: item.tokenized_result,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const toAnnotation = (item: ApiAnnotation): Annotation => ({
  id: item.id,
  documentId: item.document_id,
  entity: item.entity,
  entityType: normalizeEntityType(item.entity_type),
  startPos: item.start_pos,
  endPos: item.end_pos,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed?.id === 'number' && typeof parsed?.username === 'string') return parsed
    return null
  } catch {
    return null
  }
}

const authState: { user: AuthUser | null } = {
  user: getStoredUser(),
}

const saveAuth = (token: string | null, user: AuthUser | null): void => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)

  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)

  authState.user = user
}

const toUser = (user: AuthUser): User => ({
  id: user.id,
  username: user.username,
  password: '',
  createdAt: user.createdAt,
  updatedAt: '',
})

const mapApiError = (error: unknown): Error => {
  if (error instanceof ApiRequestError) return new Error(error.message || '请求失败')
  if (error instanceof Error) return error
  return new Error('请求失败')
}

export const mockStore = {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  get currentUser(): User | null {
    return authState.user ? toUser(authState.user) : null
  },
}

export const mockApi = {
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const data = await apiClient.request<LoginResult>('/api/users/login', {
        method: 'POST',
        body: { username, password },
      })
      saveAuth(data.token, {
        id: data.id,
        username: data.username,
        createdAt: data.created_at,
      })
      return data
    } catch (error) {
      throw mapApiError(error)
    }
  },

  async register(username: string, password: string): Promise<LoginResult> {
    try {
      await apiClient.request('/api/users', {
        method: 'POST',
        body: { username, password },
      })
      return await this.login(username, password)
    } catch (error) {
      throw mapApiError(error)
    }
  },

  async logout(): Promise<void> {
    saveAuth(null, null)
  },

  async updateUsername(newUsername: string): Promise<void> {
    if (!authState.user) throw new Error('请先登录')
    try {
      await apiClient.request(`/api/users/${authState.user.id}`, {
        method: 'PATCH',
        body: { username: newUsername },
      })
      saveAuth(mockStore.token, { ...authState.user, username: newUsername })
    } catch (error) {
      throw mapApiError(error)
    }
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!authState.user) throw new Error('请先登录')
    try {
      await this.login(authState.user.username, currentPassword)
      await apiClient.request(`/api/users/${authState.user.id}`, {
        method: 'PATCH',
        body: { password: newPassword },
      })
    } catch (error) {
      throw mapApiError(error)
    }
  },

  getCurrentUser(): User | null {
    return mockStore.currentUser
  },

  isLoggedIn(): boolean {
    return Boolean(mockStore.token && authState.user)
  },

  async getProjects(): Promise<Project[]> {
    const data = await apiClient.request<PagedResult<ApiProject>>('/api/projects')
    return data.items.map(toProject)
  },

  async getProject(id: number): Promise<Project | undefined> {
    const data = await apiClient.request<ApiProject>(`/api/projects/${id}`)
    return data ? toProject(data) : undefined
  },

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    if (!authState.user) throw new Error('请先登录')
    const created = await apiClient.request<ApiProject>('/api/projects', {
      method: 'POST',
      body: {
        name: data.name,
        description: data.description ?? '',
        ownerId: authState.user.id,
      },
    })
    return toProject(created)
  },

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const existing = await this.getProject(id)
    if (!existing) throw new Error('项目不存在')
    const updated = await apiClient.request<ApiProject>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description ?? '',
        ownerId: data.ownerId ?? existing.ownerId,
      },
    })
    return toProject(updated)
  },

  async deleteProject(id: number): Promise<void> {
    await apiClient.request(`/api/projects/${id}`, { method: 'DELETE' })
  },

  async getDocuments(projectId: number): Promise<Document[]> {
    const data = await apiClient.request<PagedResult<ApiDocument>>(`/api/projects/${projectId}/documents`)
    return data.items.map(toDocument)
  },

  async getDocument(documentId: number): Promise<Document | undefined> {
    const data = await apiClient.request<ApiDocumentWithAnnotations>(`/api/documents/${documentId}`)
    if (!data) return undefined
    const doc = toDocument(data)
    // 确保从后端返回的标注字段正确映射
    if (data.annotations) {
      Object.assign(doc, { annotations: data.annotations.map(toAnnotation) })
    }
    return doc
  },

  async createDocument(projectId: number, data: { title: string; content: string }): Promise<Document> {
    const created = await apiClient.request<ApiDocument>(`/api/projects/${projectId}/documents`, {
      method: 'POST',
      body: data,
    })
    return toDocument(created)
  },

  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    const updated = await apiClient.request<ApiDocument>(`/api/documents/${id}`, {
      method: 'PATCH',
      body: {
        title: data.title,
        content: data.content,
        parsed_result: data.parsed_result,
        tokenized_result: data.tokenized_result,
      },
    })
    return toDocument(updated)
  },

  async deleteDocument(id: number): Promise<void> {
    await apiClient.request(`/api/documents/${id}`, { method: 'DELETE' })
  },

  async getAnnotations(documentId: number): Promise<Annotation[]> {
    const data = await apiClient.request<ApiAnnotation[]>(`/api/documents/${documentId}/annotations`)
    return data.map(toAnnotation)
  },

  async createAnnotation(
    documentId: number,
    data: { entity: string; entityType: EntityType; startPos: number; endPos: number },
  ): Promise<Annotation> {
    const created = await apiClient.request<ApiAnnotation>(`/api/documents/${documentId}/annotations`, {
      method: 'POST',
      body: {
        entity: data.entity,
        entity_type: data.entityType === 'concept' ? 'other' : data.entityType,
        start_pos: data.startPos,
        end_pos: data.endPos,
      },
    })
    return toAnnotation(created)
  },

  async createAnnotationsBulk(
    documentId: number,
    data: Array<{ entity: string; entityType: EntityType; startPos: number; endPos: number }>,
  ): Promise<Annotation[]> {
    const payload = data.map(item => ({
      entity: item.entity,
      entity_type: item.entityType === 'concept' ? 'other' : item.entityType,
      start_pos: item.startPos,
      end_pos: item.endPos,
    }))
    const created = await apiClient.request<ApiAnnotation[]>(`/api/documents/${documentId}/annotations/bulk`, {
      method: 'POST',
      body: payload,
    })
    return created.map(toAnnotation)
  },

  async updateAnnotation(id: number, data: Partial<Annotation>): Promise<Annotation> {
    const updated = await apiClient.request<ApiAnnotation>(`/api/annotations/${id}`, {
      method: 'PATCH',
      body: {
        entity: data.entity,
        entity_type: data.entityType ? (data.entityType === 'concept' ? 'other' : data.entityType) : undefined,
        start_pos: data.startPos,
        end_pos: data.endPos,
      },
    })
    return toAnnotation(updated)
  },

  async deleteAnnotation(id: number): Promise<void> {
    await apiClient.request(`/api/annotations/${id}`, { method: 'DELETE' })
  },

  async autoAnnotate(documentId: number): Promise<Annotation[]> {
    const document = await this.getDocument(documentId)
    if (!document?.content) return []

    const keywords: Array<{ word: string; type: EntityType }> = [
      { word: '孔子', type: 'person' },
      { word: '项羽', type: 'person' },
      { word: '楚', type: 'location' },
      { word: '年', type: 'time' },
      { word: '君子', type: 'other' },
    ]

    const created: Annotation[] = []
    for (const item of keywords) {
      const start = document.content.indexOf(item.word)
      if (start >= 0) {
        try {
          const annotation = await this.createAnnotation(documentId, {
            entity: item.word,
            entityType: item.type,
            startPos: start,
            endPos: start + item.word.length,
          })
          created.push(annotation)
        } catch {
          // Ignore duplicate/conflict annotations during auto pass.
        }
      }
    }
    return created
  },

  async askQuestion(question: string): Promise<string> {
    if (question.includes('翻译')) return '当前版本未接入问答模型，已连接真实后端 CRUD 接口。'
    return '当前版本以真实后端接口联调为主，AI 问答暂使用占位回复。'
  },
}

export default mockApi
