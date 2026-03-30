type EntityType = 'person' | 'location' | 'time' | 'other'

interface MockUser {
  id: number
  username: string
  password: string
  createdAt: string
  updatedAt: string
}

interface MockProject {
  id: number
  name: string
  description: string | null
  ownerId: number
  createdAt: string
  updatedAt: string
}

interface MockDocument {
  id: number
  projectId: number
  title: string | null
  content: string | null
  createdAt: string
  updatedAt: string
}

interface MockAnnotation {
  id: number
  documentId: number
  entity: string
  entityType: EntityType
  startPos: number | null
  endPos: number | null
  createdAt: string
  updatedAt: string
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

type MaybeBody = Record<string, unknown> | undefined

const now = () => new Date().toISOString()

const users: MockUser[] = [
  { id: 1, username: 'admin', password: '123456', createdAt: now(), updatedAt: now() },
  { id: 2, username: 'analyst', password: '123456', createdAt: now(), updatedAt: now() },
]

const projects: MockProject[] = [
  { id: 1, name: '先秦语料标注', description: '测试项目 A', ownerId: 1, createdAt: now(), updatedAt: now() },
  { id: 2, name: '唐诗实体识别', description: '测试项目 B', ownerId: 2, createdAt: now(), updatedAt: now() },
]

const documents: MockDocument[] = [
  {
    id: 1,
    projectId: 1,
    title: '论语·学而',
    content: '学而时习之，不亦说乎。',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 2,
    projectId: 2,
    title: '静夜思',
    content: '床前明月光，疑是地上霜。',
    createdAt: now(),
    updatedAt: now(),
  },
]

const annotations: MockAnnotation[] = [
  {
    id: 1,
    documentId: 1,
    entity: '学而',
    entityType: 'other',
    startPos: 0,
    endPos: 2,
    createdAt: now(),
    updatedAt: now(),
  },
]

let userIdSeed = 3
let projectIdSeed = 3
let documentIdSeed = 3
let annotationIdSeed = 2

function ok<T>(data: T, status = 200): Response {
  const payload: ApiEnvelope<T> = { code: 0, message: 'success', data }
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status: number): Response {
  const payload: ApiEnvelope<null> = { code: status, message, data: null }
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

async function readJsonBody(request: Request): Promise<MaybeBody> {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return undefined
  }

  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return undefined
  }
}

function getPathParts(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function getById<T extends { id: number }>(list: T[], id: number): T | undefined {
  return list.find((item) => item.id === id)
}

function updateEntity<T extends Record<string, unknown>>(target: T, patch: MaybeBody): T {
  if (!patch) {
    return target
  }

  const next = { ...target }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      next[key as keyof T] = value as T[keyof T]
    }
  }
  return next
}

async function handleUsers(request: Request, parts: string[], searchParams: URLSearchParams): Promise<Response | null> {
  if (parts.length === 2 && request.method === 'GET') {
    const page = parseNumber(searchParams.get('page')) ?? 1
    const pageSize = parseNumber(searchParams.get('pageSize')) ?? 20
    const start = (page - 1) * pageSize
    const items = users.slice(start, start + pageSize)
    return ok({ items, total: users.length })
  }

  if (parts.length === 2 && request.method === 'POST') {
    const body = await readJsonBody(request)
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '').trim()

    if (!username || !password) {
      return fail('用户名和密码不能为空', 400)
    }

    if (users.some((u) => u.username === username)) {
      return fail('用户名已存在', 400)
    }

    const item: MockUser = { id: userIdSeed++, username, password, createdAt: now(), updatedAt: now() }
    users.push(item)
    return ok(item, 201)
  }

  if (parts.length === 3 && parts[2] === 'login' && request.method === 'POST') {
    const body = await readJsonBody(request)
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '').trim()
    const user = users.find((u) => u.username === username && u.password === password)

    if (!user) {
      return fail('用户名或密码错误', 401)
    }

    return ok({ id: user.id, username: user.username, token: `mock-token-${user.id}` })
  }

  if (parts.length === 3) {
    const userId = Number(parts[2])
    if (!Number.isFinite(userId)) {
      return fail('用户 ID 非法', 400)
    }

    const index = users.findIndex((item) => item.id === userId)
    if (index < 0) {
      return fail('用户不存在', 404)
    }

    if (request.method === 'GET') {
      return ok(users[index])
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await readJsonBody(request)
      const updated = updateEntity(users[index], body)
      updated.updatedAt = now()
      users[index] = updated
      return ok(updated)
    }

    if (request.method === 'DELETE') {
      users.splice(index, 1)
      return ok(null)
    }
  }

  return null
}

async function handleProjects(request: Request, parts: string[], searchParams: URLSearchParams): Promise<Response | null> {
  if (parts.length === 2 && request.method === 'GET') {
    const ownerId = parseNumber(searchParams.get('ownerId'))
    const list = ownerId ? projects.filter((p) => p.ownerId === ownerId) : projects
    return ok(list)
  }

  if (parts.length === 2 && request.method === 'POST') {
    const body = await readJsonBody(request)
    const name = String(body?.name ?? '').trim()
    const ownerId = Number(body?.ownerId)

    if (!name || !Number.isFinite(ownerId)) {
      return fail('项目参数不完整', 400)
    }

    const item: MockProject = {
      id: projectIdSeed++,
      name,
      description: (body?.description as string | null | undefined) ?? null,
      ownerId,
      createdAt: now(),
      updatedAt: now(),
    }
    projects.push(item)
    return ok(item, 201)
  }

  if (parts.length === 3) {
    const projectId = Number(parts[2])
    if (!Number.isFinite(projectId)) {
      return fail('项目 ID 非法', 400)
    }

    const index = projects.findIndex((item) => item.id === projectId)
    if (index < 0) {
      return fail('项目不存在', 404)
    }

    if (request.method === 'GET') {
      return ok(projects[index])
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await readJsonBody(request)
      const updated = updateEntity(projects[index], body)
      updated.updatedAt = now()
      projects[index] = updated
      return ok(updated)
    }

    if (request.method === 'DELETE') {
      projects.splice(index, 1)
      return ok(null)
    }
  }

  return null
}

async function handleDocuments(request: Request, parts: string[], searchParams: URLSearchParams): Promise<Response | null> {
  if (parts.length === 2 && request.method === 'GET') {
    const projectId = parseNumber(searchParams.get('projectId'))
    const keyword = (searchParams.get('keyword') || '').trim()
    let list = documents

    if (projectId) {
      list = list.filter((d) => d.projectId === projectId)
    }

    if (keyword) {
      const lower = keyword.toLowerCase()
      list = list.filter(
        (d) => (d.title || '').toLowerCase().includes(lower) || (d.content || '').toLowerCase().includes(lower),
      )
    }

    return ok(list)
  }

  if (parts.length === 3) {
    const documentId = Number(parts[2])
    if (!Number.isFinite(documentId)) {
      return fail('文档 ID 非法', 400)
    }

    const index = documents.findIndex((item) => item.id === documentId)
    if (index < 0) {
      return fail('文档不存在', 404)
    }

    if (request.method === 'GET') {
      return ok(documents[index])
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await readJsonBody(request)
      const updated = updateEntity(documents[index], body)
      updated.updatedAt = now()
      documents[index] = updated
      return ok(updated)
    }

    if (request.method === 'DELETE') {
      documents.splice(index, 1)
      return ok(null)
    }
  }

  return null
}

async function handleProjectDocuments(request: Request, parts: string[]): Promise<Response | null> {
  if (parts.length !== 4 || parts[3] !== 'documents') {
    return null
  }

  const projectId = Number(parts[2])
  if (!Number.isFinite(projectId)) {
    return fail('项目 ID 非法', 400)
  }

  if (!getById(projects, projectId)) {
    return fail('项目不存在', 404)
  }

  if (request.method === 'GET') {
    return ok(documents.filter((d) => d.projectId === projectId))
  }

  if (request.method === 'POST') {
    const body = await readJsonBody(request)
    const title = String(body?.title ?? '').trim()
    const content = String(body?.content ?? '').trim()
    if (!title || !content) {
      return fail('文档标题和内容不能为空', 400)
    }

    const item: MockDocument = {
      id: documentIdSeed++,
      projectId,
      title,
      content,
      createdAt: now(),
      updatedAt: now(),
    }
    documents.push(item)
    return ok(item, 201)
  }

  return null
}

async function handleAnnotations(request: Request, parts: string[], searchParams: URLSearchParams): Promise<Response | null> {
  if (parts.length === 2 && request.method === 'GET') {
    const projectId = parseNumber(searchParams.get('projectId'))
    const documentId = parseNumber(searchParams.get('documentId'))
    const entityType = (searchParams.get('entityType') || '').trim()

    let list = annotations

    if (documentId) {
      list = list.filter((a) => a.documentId === documentId)
    }

    if (projectId) {
      const docIds = new Set(documents.filter((d) => d.projectId === projectId).map((d) => d.id))
      list = list.filter((a) => docIds.has(a.documentId))
    }

    if (entityType) {
      list = list.filter((a) => a.entityType === entityType)
    }

    return ok(list)
  }

  if (parts.length === 3) {
    const annotationId = Number(parts[2])
    if (!Number.isFinite(annotationId)) {
      return fail('标注 ID 非法', 400)
    }

    const index = annotations.findIndex((item) => item.id === annotationId)
    if (index < 0) {
      return fail('标注不存在', 404)
    }

    if (request.method === 'GET') {
      return ok(annotations[index])
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await readJsonBody(request)
      const updated = updateEntity(annotations[index], body)
      updated.updatedAt = now()
      annotations[index] = updated
      return ok(updated)
    }

    if (request.method === 'DELETE') {
      annotations.splice(index, 1)
      return ok(null)
    }
  }

  return null
}

async function handleDocumentAnnotations(request: Request, parts: string[]): Promise<Response | null> {
  if (parts.length !== 4 || parts[3] !== 'annotations') {
    return null
  }

  const documentId = Number(parts[2])
  if (!Number.isFinite(documentId)) {
    return fail('文档 ID 非法', 400)
  }

  if (!getById(documents, documentId)) {
    return fail('文档不存在', 404)
  }

  if (request.method === 'GET') {
    return ok(annotations.filter((a) => a.documentId === documentId))
  }

  if (request.method === 'POST') {
    const body = await readJsonBody(request)
    const entity = String(body?.entity ?? '').trim()
    const entityType = String(body?.entityType ?? '').trim() as EntityType
    const startPos = Number(body?.startPos)
    const endPos = Number(body?.endPos)

    if (!entity || !entityType || !Number.isFinite(startPos) || !Number.isFinite(endPos)) {
      return fail('标注参数不完整', 400)
    }

    const item: MockAnnotation = {
      id: annotationIdSeed++,
      documentId,
      entity,
      entityType,
      startPos,
      endPos,
      createdAt: now(),
      updatedAt: now(),
    }
    annotations.push(item)
    return ok(item, 201)
  }

  return null
}

async function routeApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url, window.location.origin)
  const parts = getPathParts(url.pathname)

  if (parts[0] !== 'api') {
    return null
  }

  if (parts[1] === 'users') {
    return handleUsers(request, parts, url.searchParams)
  }

  if (parts[1] === 'projects') {
    const nested = await handleProjectDocuments(request, parts)
    if (nested) {
      return nested
    }
    return handleProjects(request, parts, url.searchParams)
  }

  if (parts[1] === 'documents') {
    const nested = await handleDocumentAnnotations(request, parts)
    if (nested) {
      return nested
    }
    return handleDocuments(request, parts, url.searchParams)
  }

  if (parts[1] === 'annotations') {
    return handleAnnotations(request, parts, url.searchParams)
  }

  return null
}

export function installMockServer(): void {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init)
    const mockResponse = await routeApiRequest(request)
    if (mockResponse) {
      return mockResponse
    }
    return originalFetch(input, init)
  }

  console.info('[mock] 前端 Mock 服务已启用')
}
