import { apiClient } from './http'
import type {
  Annotation,
  AnnotationCreate,
  AnnotationPatch,
  AnnotationUpdate,
  EntityType,
} from './types'

export interface ListAnnotationsParams {
  projectId?: number
  documentId?: number
  entityType?: EntityType
}

// 文档维度的标注接口。
export function listAnnotationsByDocument(documentId: number): Promise<Annotation[]> {
  return apiClient.request<Annotation[]>(`/api/documents/${documentId}/annotations`)
}

export function createAnnotationInDocument(documentId: number, payload: AnnotationCreate): Promise<Annotation> {
  return apiClient.request<Annotation>(`/api/documents/${documentId}/annotations`, {
    method: 'POST',
    body: payload,
  })
}

export function createAnnotationsBulk(documentId: number, payload: AnnotationCreate[]): Promise<Annotation[]> {
  return apiClient.request<Annotation[]>(`/api/documents/${documentId}/annotations/bulk`, {
    method: 'POST',
    body: payload,
  })
}

// 全局标注查询接口，支持多条件过滤。
export function listAnnotations(params: ListAnnotationsParams = {}): Promise<Annotation[]> {
  return apiClient.request<Annotation[]>('/api/annotations', {
    query: {
      projectId: params.projectId,
      documentId: params.documentId,
      entityType: params.entityType,
    },
  })
}

export function getAnnotation(annotationId: number): Promise<Annotation> {
  return apiClient.request<Annotation>(`/api/annotations/${annotationId}`)
}

export function updateAnnotation(annotationId: number, payload: AnnotationUpdate): Promise<Annotation> {
  return apiClient.request<Annotation>(`/api/annotations/${annotationId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function patchAnnotation(annotationId: number, payload: AnnotationPatch): Promise<Annotation> {
  return apiClient.request<Annotation>(`/api/annotations/${annotationId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteAnnotation(annotationId: number): Promise<null> {
  return apiClient.request<null>(`/api/annotations/${annotationId}`, {
    method: 'DELETE',
  })
}
