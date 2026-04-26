import { describe, it, expect, beforeEach } from 'vitest'
import { mockFetch } from '../setup'

const mockResponse = (data: unknown, init?: ResponseInit) => {
  const response = {
    ok: init?.status === undefined || (init.status >= 200 && init.status < 300),
    status: init?.status ?? 200,
    json: () => Promise.resolve(data),
    ...init,
  } as Response
  return response
}

describe('api/ai', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('analyzeText', () => {
    it('sends POST request with text body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { sentence: '古之学者为己', grammar: '省略句', meaning: '古代学习的人是为了修养自己' },
        }),
      )

      const { analyzeText } = await import('@/api/ai')
      await analyzeText('古之学者为人')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/analyze'),
        expect.objectContaining({ method: 'POST' }),
      )
      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.text).toBe('古之学者为人')
    })

    it('returns parsed AnalysisResult', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: { sentence: '吾日三省吾身', grammar: '倒装句', meaning: '我每天多次反省自己' },
        }),
      )

      const { analyzeText } = await import('@/api/ai')
      const result = await analyzeText('吾日三省吾身')

      expect(result.sentence).toBe('吾日三省吾身')
      expect(result.grammar).toBe('倒装句')
      expect(result.meaning).toBe('我每天多次反省自己')
    })

    it('throws on non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Server error' }, { status: 500 }))

      const { analyzeText } = await import('@/api/ai')
      await expect(analyzeText('test')).rejects.toThrow()
    })
  })

  describe('aiChat', () => {
    it('sends POST request with ChatRequest body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: '这是智能回答内容' }),
      )

      const { aiChat } = await import('@/api/ai')
      await aiChat({ text: '仁者爱人', question: '这句话什么意思' })

      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.text).toBe('仁者爱人')
      expect(body.question).toBe('这句话什么意思')
    })

    it('returns chat response string', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: '孔子的仁指仁爱之心' }),
      )

      const { aiChat } = await import('@/api/ai')
      const result = await aiChat({ text: '仁者爱人', question: '仁是什么意思' })

      expect(result).toBe('孔子的仁指仁爱之心')
    })

    it('includes history in request when provided', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: '继续讨论' }),
      )

      const { aiChat } = await import('@/api/ai')
      await aiChat({
        text: '仁',
        question: '仁的哲学含义',
        history: [
          { role: 'user', content: '什么是仁' },
          { role: 'assistant', content: '仁者爱人' },
        ],
      })

      const [, opts] = mockFetch.mock.calls[0]!
      const body = JSON.parse(opts.body as string)
      expect(body.history).toHaveLength(2)
      expect(body.history[0]!.role).toBe('user')
    })

    it('throws on business error code', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 500, message: 'Model unavailable' }, { status: 200 }),
      )

      const { aiChat } = await import('@/api/ai')
      await expect(aiChat({ text: 'x', question: 'y' })).rejects.toThrow('Model unavailable')
    })
  })

  describe('autoAnnotate', () => {
    it('sends POST request with text body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { entity: '孔子', entity_type: 'person', reason: '儒家学派创始人' },
            { entity: '鲁国', entity_type: 'location' },
          ],
        }),
      )

      const { autoAnnotate } = await import('@/api/ai')
      await autoAnnotate('孔子是鲁国人也')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/auto-annotate'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns AutoAnnotationResult array', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { entity: '君子', entity_type: 'concept', reason: '儒家核心概念' },
            { entity: '三年', entity_type: 'time' },
          ],
        }),
      )

      const { autoAnnotate } = await import('@/api/ai')
      const results = await autoAnnotate('君子三年不窺園林')

      expect(results).toHaveLength(2)
      expect(results[0]!.entity).toBe('君子')
      expect(results[0]!.entity_type).toBe('concept')
      expect(results[1]!.entity).toBe('三年')
      expect(results[1]!.entity_type).toBe('time')
    })

    it('returns empty array when no entities found', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ code: 0, message: 'ok', data: [] }),
      )

      const { autoAnnotate } = await import('@/api/ai')
      const results = await autoAnnotate('')

      expect(results).toEqual([])
    })
  })

  describe('tokenizeText', () => {
    it('sends POST request with text body', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { word: '古文', pos: 'n' },
            { word: '标注', pos: 'v' },
          ],
        }),
      )

      const { tokenizeText } = await import('@/api/ai')
      await tokenizeText('古文标注')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/tokenize'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('returns TokenizeResult array', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          code: 0,
          message: 'ok',
          data: [
            { word: '古之', pos: 'n' },
            { word: '学者', pos: 'n' },
            { word: '为己', pos: 'v' },
          ],
        }),
      )

      const { tokenizeText } = await import('@/api/ai')
      const result = await tokenizeText('古之学者为己')

      expect(result).toHaveLength(3)
      expect(result[0]!.word).toBe('古之')
      expect(result[0]!.pos).toBe('n')
    })
  })
})
