import { apiClient } from './http'
import type { Document, DocumentCreate, DocumentPatch, DocumentUpdate } from './types'

export interface ListDocumentsParams {
  projectId?: number
  keyword?: string
}

// 项目维度的文档接口。
export function listDocumentsByProject(projectId: number): Promise<Document[]> {
  return apiClient.request<Document[]>(`/api/projects/${projectId}/documents`)
}

export function createDocumentInProject(projectId: number, payload: DocumentCreate): Promise<Document> {
  return apiClient.request<Document>(`/api/projects/${projectId}/documents`, {
    method: 'POST',
    body: payload,
  })
}

// 全局文档查询接口，支持按项目和关键字过滤。
export function listDocuments(params: ListDocumentsParams = {}): Promise<Document[]> {
  return apiClient.request<Document[]>('/api/documents', {
    query: {
      projectId: params.projectId,
      keyword: params.keyword,
    },
  })
}

export function getDocument(documentId: number): Promise<Document> {
  return apiClient.request<Document>(`/api/documents/${documentId}`)
}

export function updateDocument(documentId: number, payload: DocumentUpdate): Promise<Document> {
  return apiClient.request<Document>(`/api/documents/${documentId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function patchDocument(documentId: number, payload: DocumentPatch): Promise<Document> {
  return apiClient.request<Document>(`/api/documents/${documentId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteDocument(documentId: number): Promise<null> {
  return apiClient.request<null>(`/api/documents/${documentId}`, {
    method: 'DELETE',
  })
}
