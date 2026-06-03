export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ListResult<T> {
  items: T[]
  total: number
}

export type EntityType = 'person' | 'location' | 'time' | 'concept' | 'other'

export interface User {
  id: number
  username: string
  password: string
  createdAt: string
  updatedAt: string
  created_at?: string
  updated_at?: string
}

export interface UserCreate {
  username: string
  password: string
}

export type UserUpdate = UserCreate

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
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  ownerId: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  documentsCount?: number
  annotationsCount?: number
  entityDistribution?: Record<string, number>
}

export interface ProjectCreate {
  name: string
  description?: string | null
  ownerId: number
}

export type ProjectUpdate = ProjectCreate

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
  parsed_result?: Record<string, unknown>
  tokenized_result?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface DocumentCreate {
  title: string
  content: string
}

export type DocumentUpdate = DocumentCreate

export interface DocumentPatch {
  title?: string
  content?: string
  parsed_result?: Record<string, unknown>
  tokenized_result?: Record<string, unknown>
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

export type AnnotationUpdate = AnnotationCreate

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
