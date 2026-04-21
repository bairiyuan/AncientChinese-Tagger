import { apiClient } from './http'

export interface AnalysisResult {
  sentence: string
  grammar: string
  meaning: string
}

export interface ChatRequest {
  text: string
  question: string
  history?: Array<{ role: string; content: string }>
}

export function analyzeText(text: string): Promise<AnalysisResult> {
  return apiClient.request<AnalysisResult>('/api/ai/analyze', {
    method: 'POST',
    body: { text },
  })
}

export function aiChat(payload: ChatRequest): Promise<string> {
  return apiClient.request<string>('/api/ai/chat', {
    method: 'POST',
    body: payload,
  })
}

export interface AutoAnnotationResult {
  entity: string
  entity_type: string
  reason?: string
}

export function autoAnnotate(text: string): Promise<AutoAnnotationResult[]> {
  return apiClient.request<AutoAnnotationResult[]>('/api/ai/auto-annotate', {
    method: 'POST',
    body: { text },
  })
}

export interface TokenizeResult {
  word: string
  pos: string
}

export function tokenizeText(text: string): Promise<TokenizeResult[]> {
  return apiClient.request<TokenizeResult[]>('/api/ai/tokenize', {
    method: 'POST',
    body: { text },
  })
}
