import { apiClient } from './http'
import type {
  ListResult,
  LoginPayload,
  LoginResult,
  PaginationParams,
  User,
  UserCreate,
  UserPatch,
  UserUpdate,
} from './types'

// 用户列表接口返回分页结构：{ items, total }。
export function listUsers(params: PaginationParams = {}): Promise<ListResult<User>> {
  return apiClient.request<ListResult<User>>('/api/users', {
    query: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })
}

export function getUser(userId: number): Promise<User> {
  return apiClient.request<User>(`/api/users/${userId}`)
}

export function createUser(payload: UserCreate): Promise<User> {
  return apiClient.request<User>('/api/users', {
    method: 'POST',
    body: payload,
  })
}

export function updateUser(userId: number, payload: UserUpdate): Promise<User> {
  return apiClient.request<User>(`/api/users/${userId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function patchUser(userId: number, payload: UserPatch): Promise<User> {
  return apiClient.request<User>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteUser(userId: number): Promise<null> {
  return apiClient.request<null>(`/api/users/${userId}`, {
    method: 'DELETE',
  })
}

// 登录接口返回 token，可用于后续鉴权请求。
export function login(payload: LoginPayload): Promise<LoginResult> {
  return apiClient.request<LoginResult>('/api/users/login', {
    method: 'POST',
    body: payload,
  })
}
