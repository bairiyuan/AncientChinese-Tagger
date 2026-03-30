import { apiClient } from './http'
import type { Project, ProjectCreate, ProjectPatch, ProjectUpdate } from './types'

export interface ListProjectsParams {
  ownerId?: number
}

// 项目相关接口：/api/projects 与 /api/projects/{projectId}。
export function listProjects(params: ListProjectsParams = {}): Promise<Project[]> {
  return apiClient.request<Project[]>('/api/projects', {
    query: {
      ownerId: params.ownerId,
    },
  })
}

export function getProject(projectId: number): Promise<Project> {
  return apiClient.request<Project>(`/api/projects/${projectId}`)
}

export function createProject(payload: ProjectCreate): Promise<Project> {
  return apiClient.request<Project>('/api/projects', {
    method: 'POST',
    body: payload,
  })
}

export function updateProject(projectId: number, payload: ProjectUpdate): Promise<Project> {
  return apiClient.request<Project>(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function patchProject(projectId: number, payload: ProjectPatch): Promise<Project> {
  return apiClient.request<Project>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteProject(projectId: number): Promise<null> {
  return apiClient.request<null>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })
}
