import { describe, it, expect } from 'vitest'
import type {
  EntityType,
  User,
  UserCreate,
  UserUpdate,
  UserPatch,
  LoginPayload,
  LoginResult,
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectPatch,
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentPatch,
  Annotation,
  AnnotationCreate,
  AnnotationUpdate,
  AnnotationPatch,
  PaginationParams,
  ApiResponse,
  ListResult,
} from '@/api/types'

describe('EntityType', () => {
  it.each(['person', 'location', 'time', 'concept', 'other'] as EntityType[])(
    'accepts "%s" as valid EntityType',
    (type) => {
      const val: EntityType = type
      expect(val).toBe(type)
    },
  )
})

describe('User', () => {
  it('has all required fields', () => {
    const user: User = {
      id: 1,
      username: 'alice',
      password: 'secret',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }
    expect(user.id).toBe(1)
    expect(user.username).toBe('alice')
    expect(user.password).toBe('secret')
    expect(user.createdAt).toBeTruthy()
    expect(user.updatedAt).toBeTruthy()
  })

  it('allows optional created_at/updated_at from API', () => {
    const user: User = {
      id: 1,
      username: 'bob',
      password: '',
      createdAt: '',
      updatedAt: '',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    }
    expect(user.created_at).toBe('2025-01-01T00:00:00Z')
    expect(user.updated_at).toBe('2025-01-02T00:00:00Z')
  })
})

describe('UserCreate / UserUpdate', () => {
  it('UserCreate requires username and password', () => {
    const payload: UserCreate = { username: 'alice', password: 'secret' }
    expect(payload.username).toBe('alice')
    expect(payload.password).toBe('secret')
  })

  it('UserUpdate has same shape as UserCreate', () => {
    const update: UserUpdate = { username: 'alice2', password: 'newpass' }
    expect(update).toEqual({ username: 'alice2', password: 'newpass' })
  })
})

describe('UserPatch', () => {
  it('accepts partial update', () => {
    const patch: UserPatch = { username: 'newname' }
    expect(patch.username).toBe('newname')
    expect((patch as UserPatch).password).toBeUndefined()
  })
})

describe('LoginPayload', () => {
  it('requires username and password', () => {
    const payload: LoginPayload = { username: 'alice', password: 'secret' }
    expect(payload.username).toBe('alice')
    expect(payload.password).toBe('secret')
  })
})

describe('LoginResult', () => {
  it('contains token and user info', () => {
    const result: LoginResult = {
      id: 1,
      username: 'alice',
      token: 'jwt-token',
      created_at: '2025-01-01T00:00:00Z',
    }
    expect(result.token).toBe('jwt-token')
    expect(result.username).toBe('alice')
    expect(result.created_at).toBeTruthy()
  })
})

describe('Project', () => {
  it('has all required fields plus optional counts', () => {
    const project: Project = {
      id: 1,
      name: 'Shiji Annotations',
      description: 'Historical text project',
      ownerId: 10,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      documentsCount: 5,
      annotationsCount: 120,
      entityDistribution: { person: 40, location: 30, time: 20, concept: 20, other: 10 },
    }
    expect(project.documentsCount).toBe(5)
    expect(project.entityDistribution?.person).toBe(40)
  })

  it('allows null description', () => {
    const project: Project = {
      id: 2,
      name: 'Empty',
      description: null,
      ownerId: 1,
      createdAt: '',
      updatedAt: '',
    }
    expect(project.description).toBeNull()
  })

  it('allows optional deletedAt', () => {
    const project: Project = {
      id: 3,
      name: 'Deleted',
      description: null,
      ownerId: 1,
      createdAt: '',
      updatedAt: '',
      deletedAt: '2025-06-01T00:00:00Z',
    }
    expect(project.deletedAt).toBe('2025-06-01T00:00:00Z')
  })
})

describe('ProjectCreate / ProjectUpdate / ProjectPatch', () => {
  it('ProjectCreate requires name, description and ownerId', () => {
    const create: ProjectCreate = { name: 'Test', description: 'Desc', ownerId: 1 }
    expect(create.name).toBe('Test')
  })

  it('ProjectUpdate has same shape as ProjectCreate', () => {
    const update: ProjectUpdate = { name: 'Test2', description: null, ownerId: 2 }
    expect(update.name).toBe('Test2')
  })

  it('ProjectPatch is fully optional', () => {
    const patch: ProjectPatch = { name: 'Renamed' }
    expect(patch.name).toBe('Renamed')
    expect(patch.ownerId).toBeUndefined()
  })
})

describe('Document', () => {
  it('has required fields', () => {
    const doc: Document = {
      id: 1,
      projectId: 5,
      title: 'Chapter 1',
      content: '古之学者为己',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }
    expect(doc.projectId).toBe(5)
    expect(doc.title).toBe('Chapter 1')
    expect(doc.content).toBe('古之学者为己')
  })

  it('allows null title and content', () => {
    const doc: Document = {
      id: 2,
      projectId: 5,
      title: null,
      content: null,
      createdAt: '',
      updatedAt: '',
    }
    expect(doc.title).toBeNull()
    expect(doc.content).toBeNull()
  })

  it('allows optional deletedAt', () => {
    const doc: Document = {
      id: 3,
      projectId: 5,
      title: null,
      content: null,
      createdAt: '',
      updatedAt: '',
      deletedAt: '2025-06-01T00:00:00Z',
    }
    expect(doc.deletedAt).toBe('2025-06-01T00:00:00Z')
  })
})

describe('DocumentCreate / DocumentUpdate / DocumentPatch', () => {
  it('DocumentCreate requires title and content', () => {
    const create: DocumentCreate = { title: 'Title', content: 'Content' }
    expect(create.title).toBe('Title')
  })

  it('DocumentUpdate has same shape as DocumentCreate', () => {
    const update: DocumentUpdate = { title: 'New', content: 'New content' }
    expect(update).toEqual({ title: 'New', content: 'New content' })
  })

  it('DocumentPatch allows partial update', () => {
    const patch: DocumentPatch = { title: 'Only title' }
    expect(patch.content).toBeUndefined()
  })
})

describe('Annotation', () => {
  it('has all required fields', () => {
    const ann: Annotation = {
      id: 1,
      documentId: 10,
      entity: '孔子',
      entityType: 'person',
      startPos: 0,
      endPos: 2,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }
    expect(ann.entity).toBe('孔子')
    expect(ann.entityType).toBe('person')
    expect(ann.startPos).toBe(0)
    expect(ann.endPos).toBe(2)
  })

  it('allows null startPos and endPos', () => {
    const ann: Annotation = {
      id: 2,
      documentId: 10,
      entity: '君子',
      entityType: 'concept',
      startPos: null,
      endPos: null,
      createdAt: '',
      updatedAt: '',
    }
    expect(ann.startPos).toBeNull()
    expect(ann.endPos).toBeNull()
  })

  it('accepts all entity types', () => {
    const types: EntityType[] = ['person', 'location', 'time', 'concept', 'other']
    types.forEach((type) => {
      const ann: Annotation = {
        id: 0,
        documentId: 1,
        entity: 'x',
        entityType: type,
        startPos: null,
        endPos: null,
        createdAt: '',
        updatedAt: '',
      }
      expect(ann.entityType).toBe(type)
    })
  })
})

describe('AnnotationCreate / AnnotationUpdate / AnnotationPatch', () => {
  it('AnnotationCreate requires all fields', () => {
    const create: AnnotationCreate = { entity: '孔子', entityType: 'person', startPos: 0, endPos: 2 }
    expect(create.entity).toBe('孔子')
  })

  it('AnnotationUpdate has same shape as AnnotationCreate', () => {
    const update: AnnotationUpdate = { entity: '孟子', entityType: 'person', startPos: 3, endPos: 5 }
    expect(update.entity).toBe('孟子')
  })

  it('AnnotationPatch allows partial update', () => {
    const patch: AnnotationPatch = { entity: '老子' }
    expect(patch.entityType).toBeUndefined()
    expect(patch.startPos).toBeUndefined()
  })
})

describe('PaginationParams', () => {
  it('has optional page and pageSize', () => {
    const p1: PaginationParams = {}
    expect(p1.page).toBeUndefined()
    expect(p1.pageSize).toBeUndefined()

    const p2: PaginationParams = { page: 2, pageSize: 20 }
    expect(p2.page).toBe(2)
    expect(p2.pageSize).toBe(20)
  })

  it('accepts boundary values for page', () => {
    const p1: PaginationParams = { page: 1 }
    expect(p1.page).toBe(1)

    const p2: PaginationParams = { page: 0 }
    expect(p2.page).toBe(0)

    const p3: PaginationParams = { page: -1 }
    expect(p3.page).toBe(-1)

    const p4: PaginationParams = { page: 999999 }
    expect(p4.page).toBe(999999)
  })

  it('accepts boundary values for pageSize', () => {
    const p1: PaginationParams = { pageSize: 1 }
    expect(p1.pageSize).toBe(1)

    const p2: PaginationParams = { pageSize: 0 }
    expect(p2.pageSize).toBe(0)

    const p3: PaginationParams = { pageSize: -1 }
    expect(p3.pageSize).toBe(-1)

    const p4: PaginationParams = { pageSize: 10000 }
    expect(p4.pageSize).toBe(10000)
  })

  it('accepts extreme combined boundary values', () => {
    const extreme: PaginationParams = { page: 0, pageSize: 0 }
    expect(extreme.page).toBe(0)
    expect(extreme.pageSize).toBe(0)

    const large: PaginationParams = { page: 999999, pageSize: 999999 }
    expect(large.page).toBe(999999)
    expect(large.pageSize).toBe(999999)

    const negative: PaginationParams = { page: -999, pageSize: -999 }
    expect(negative.page).toBe(-999)
    expect(negative.pageSize).toBe(-999)
  })
})

describe('ApiResponse', () => {
  it('wraps any data type', () => {
    const response: ApiResponse<User[]> = {
      code: 0,
      message: 'ok',
      data: [],
    }
    expect(response.code).toBe(0)
    expect(response.data).toEqual([])
  })
})

describe('ListResult', () => {
  it('contains items array and total count', () => {
    const result: ListResult<Project> = {
      items: [],
      total: 0,
    }
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)

    const filled: ListResult<User> = {
      items: [{ id: 1, username: 'alice', password: '', createdAt: '', updatedAt: '' }],
      total: 1,
    }
    expect(filled.items.length).toBe(1)
    expect(filled.total).toBe(1)
  })
})
