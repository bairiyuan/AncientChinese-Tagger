export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ListResult<T> {
  items: T[]
  total: number
}

export type EntityType = 'person' | 'location' | 'time' | 'other'

export interface User {
  id: number
  username: string
  password: string
  createdAt: string
  updatedAt: string
}

export interface UserCreate {
  username: string
  password: string
}

export interface UserUpdate extends UserCreate {}

export interface UserPatch {
  username?: string
  password?: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  id: number
  username: string
  token: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  ownerId: number
  createdAt: string
  updatedAt: string
}

export interface ProjectCreate {
  name: string
  description?: string | null
  ownerId: number
}

export interface ProjectUpdate extends ProjectCreate {}

export interface ProjectPatch {
  name?: string
  description?: string | null
  ownerId?: number
}

export interface Document {
  id: number
  projectId: number
  title: string | null
  content: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentCreate {
  title: string
  content: string
}

export interface DocumentUpdate extends DocumentCreate {}

export interface DocumentPatch {
  title?: string
  content?: string
}

export interface Annotation {
  id: number
  documentId: number
  entity: string
  entityType: EntityType
  startPos: number | null
  endPos: number | null
  createdAt: string
  updatedAt: string
}

export interface AnnotationCreate {
  entity: string
  entityType: EntityType
  startPos: number
  endPos: number
}

export interface AnnotationUpdate extends AnnotationCreate {}

export interface AnnotationPatch {
  entity?: string
  entityType?: EntityType
  startPos?: number
  endPos?: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}
