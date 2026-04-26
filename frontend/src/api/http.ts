import type { ApiResponse } from './types'

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
}

export class ApiRequestError extends Error {
  status: number
  code?: number
  payload?: unknown

  constructor(message: string, status: number, code?: number, payload?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

// 构建 URL 查询字符串，并忽略空值参数，避免产生无意义查询项。
function buildQueryString(query?: Record<string, QueryValue>): string {
  if (!query) {
    return ''
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    params.set(key, String(value))
  }

  const asString = params.toString()
  return asString ? `?${asString}` : ''
}

// 后端当前同时使用 0 和 200 作为业务成功码。
function isSuccessCode(code: number | undefined): boolean {
  return code === 0 || code === 200
}

export class HttpClient {
  private readonly baseUrl: string
  private tokenGetter?: () => string | null | undefined

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setTokenGetter(getter: () => string | null | undefined): void {
    this.tokenGetter = getter
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', query, body, headers, signal } = options
    const url = `${this.baseUrl}${path}${buildQueryString(query)}`

    const nextHeaders = new Headers(headers)
    if (body !== undefined && !nextHeaders.has('Content-Type')) {
      nextHeaders.set('Content-Type', 'application/json')
    }

    const token = this.tokenGetter?.()
    if (token && !nextHeaders.has('Authorization')) {
      nextHeaders.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(url, {
      method,
      headers: nextHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })

    const payload = await response.json().catch(() => undefined)
    if (!response.ok) {
      const envelope = payload as Partial<ApiResponse<unknown>> | undefined
      throw new ApiRequestError(
        envelope?.message ?? `HTTP ${response.status}`,
        response.status,
        envelope?.code,
        payload,
      )
    }

    // 优先按 OpenAPI 约定的响应包结构解包：{ code, message, data }。
    const envelope = payload as ApiResponse<T>
    if (envelope && typeof envelope === 'object' && 'code' in envelope && 'message' in envelope) {
      if (!isSuccessCode(envelope.code)) {
        throw new ApiRequestError(envelope.message || 'Business error', response.status, envelope.code, envelope)
      }
      return envelope.data
    }

    return payload as T
  }
}

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '')

export const apiClient = new HttpClient(normalizedBaseUrl)
