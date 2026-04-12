import type {
  User,
  Project,
  Document,
  Annotation,
  EntityType,
  LoginResult
} from '@/api/types'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟数据存储
class MockDataStore {
  users: User[] = [
    {
      id: 1,
      username: 'admin',
      password: '123456',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
  ]

  projects: Project[] = [
    {
      id: 1,
      name: '论语注释研究',
      description: '对《论语》进行系统性的文本标注与研究',
      ownerId: 1,
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-03-10T00:00:00Z'
    },
    {
      id: 2,
      name: '诗经古韵分析',
      description: '《诗经》文本的韵律与语言特征分析',
      ownerId: 1,
      createdAt: '2026-01-12T00:00:00Z',
      updatedAt: '2026-03-09T00:00:00Z'
    },
    {
      id: 3,
      name: '史记人物标注',
      description: '《史记》中历史人物及地名的实体标注',
      ownerId: 1,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-03-08T00:00:00Z'
    },
    {
      id: 4,
      name: '唐诗宋词集',
      description: '唐诗宋词作品的文本整理与分析',
      ownerId: 1,
      createdAt: '2026-01-18T00:00:00Z',
      updatedAt: '2026-03-07T00:00:00Z'
    }
  ]

  documents: Document[] = [
    {
      id: 1,
      projectId: 1,
      title: '学而篇',
      content: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-03-10T00:00:00Z'
    },
    {
      id: 2,
      projectId: 1,
      title: '为政篇',
      content: '子曰："为政以德，譬如北辰，居其所而众星共之。"',
      createdAt: '2026-01-16T00:00:00Z',
      updatedAt: '2026-03-09T00:00:00Z'
    },
    {
      id: 3,
      projectId: 1,
      title: '八佾篇',
      content: '孔子谓季氏："八佾舞于庭，是可忍也，孰不可忍也？"',
      createdAt: '2026-01-17T00:00:00Z',
      updatedAt: '2026-03-08T00:00:00Z'
    },
    {
      id: 4,
      projectId: 2,
      title: '关雎',
      content: '关关雎鸠，在河之洲。窈窕淑女，君子好逑。',
      createdAt: '2026-01-20T00:00:00Z',
      updatedAt: '2026-03-05T00:00:00Z'
    },
    {
      id: 5,
      projectId: 3,
      title: '项羽本纪',
      content: '项籍者，下相人也，字羽。初起时，年二十四。',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z'
    }
  ]

  annotations: Annotation[] = [
    {
      id: 1,
      documentId: 1,
      entity: '孔子',
      entityType: 'person',
      startPos: 3,
      endPos: 5,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z'
    },
    {
      id: 2,
      documentId: 1,
      entity: '君子',
      entityType: 'concept',
      startPos: 45,
      endPos: 47,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z'
    }
  ]

  currentUser: User | null = null
  token: string | null = null
}

export const mockStore = new MockDataStore()

// API 函数
export const mockApi = {
  // 用户相关
  async login(username: string, password: string): Promise<LoginResult> {
    await delay(500)
    const user = mockStore.users.find(u => u.username === username && u.password === password)
    if (!user) {
      throw new Error('用户名或密码错误')
    }
    mockStore.currentUser = user
    mockStore.token = `mock_token_${user.id}_${Date.now()}`
    return {
      id: user.id,
      username: user.username,
      token: mockStore.token
    }
  },

  async register(username: string, password: string): Promise<LoginResult> {
    await delay(500)
    const existingUser = mockStore.users.find(u => u.username === username)
    if (existingUser) {
      throw new Error('用户名已存在')
    }
    const newUser: User = {
      id: mockStore.users.length + 1,
      username,
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockStore.users.push(newUser)
    mockStore.currentUser = newUser
    mockStore.token = `mock_token_${newUser.id}_${Date.now()}`
    return {
      id: newUser.id,
      username: newUser.username,
      token: mockStore.token
    }
  },

  async logout(): Promise<void> {
    await delay(200)
    mockStore.currentUser = null
    mockStore.token = null
  },

  async updateUsername(newUsername: string): Promise<void> {
    await delay(500)
    if (!mockStore.currentUser) {
      throw new Error('请先登录')
    }
    const currentId = mockStore.currentUser.id
    const existing = mockStore.users.find(u => u.username === newUsername && u.id !== currentId)
    if (existing) {
      throw new Error('用户名已存在')
    }
    const index = mockStore.users.findIndex(u => u.id === currentId)
    if (index !== -1) {
      mockStore.users[index]!.username = newUsername
      mockStore.currentUser.username = newUsername
    }
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await delay(500)
    if (!mockStore.currentUser) {
      throw new Error('请先登录')
    }
    const user = mockStore.users.find(u => u.id === mockStore.currentUser!.id)
    if (!user || user.password !== currentPassword) {
      throw new Error('当前密码错误')
    }
    const index = mockStore.users.findIndex(u => u.id === mockStore.currentUser!.id)
    if (index !== -1) {
      mockStore.users[index]!.password = newPassword
      mockStore.users[index]!.updatedAt = new Date().toISOString()
    }
  },

  getCurrentUser(): User | null {
    return mockStore.currentUser
  },

  isLoggedIn(): boolean {
    return mockStore.currentUser !== null
  },

  // 项目相关
  async getProjects(): Promise<Project[]> {
    await delay(300)
    return [...mockStore.projects]
  },

  async getProject(id: number): Promise<Project | undefined> {
    await delay(200)
    return mockStore.projects.find(p => p.id === id)
  },

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    await delay(400)
    const newProject: Project = {
      id: Math.max(...mockStore.projects.map(p => p.id), 0) + 1,
      name: data.name,
      description: data.description || null,
      ownerId: mockStore.currentUser?.id || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockStore.projects.unshift(newProject)
    return newProject
  },

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    await delay(300)
    const index = mockStore.projects.findIndex(p => p.id === id)
    if (index === -1) throw new Error('项目不存在')
    const existing = mockStore.projects[index]
    if (!existing) throw new Error('项目不存在')
    const updated: Project = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString()
    }
    mockStore.projects[index] = updated
    return updated
  },

  async deleteProject(id: number): Promise<void> {
    await delay(300)
    const index = mockStore.projects.findIndex(p => p.id === id)
    if (index === -1) throw new Error('项目不存在')
    mockStore.projects.splice(index, 1)
    // 同时删除项目下的文档
    mockStore.documents = mockStore.documents.filter(d => d.projectId !== id)
  },

  // 文档相关
  async getDocuments(projectId: number): Promise<Document[]> {
    await delay(300)
    return mockStore.documents.filter(d => d.projectId === projectId)
  },

  async getDocument(id: number): Promise<Document | undefined> {
    await delay(200)
    return mockStore.documents.find(d => d.id === id)
  },

  async createDocument(projectId: number, data: { title: string; content: string }): Promise<Document> {
    await delay(400)
    const newDoc: Document = {
      id: Math.max(...mockStore.documents.map(d => d.id), 0) + 1,
      projectId,
      title: data.title,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockStore.documents.push(newDoc)
    return newDoc
  },

  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    await delay(300)
    const index = mockStore.documents.findIndex(d => d.id === id)
    if (index === -1) throw new Error('文档不存在')
    const existing = mockStore.documents[index]
    if (!existing) throw new Error('文档不存在')
    const updated: Document = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString()
    }
    mockStore.documents[index] = updated
    return updated
  },

  async deleteDocument(id: number): Promise<void> {
    await delay(300)
    const index = mockStore.documents.findIndex(d => d.id === id)
    if (index === -1) throw new Error('文档不存在')
    mockStore.documents.splice(index, 1)
    // 同时删除文档下的标注
    mockStore.annotations = mockStore.annotations.filter(a => a.documentId !== id)
  },

  // 标注相关
  async getAnnotations(documentId: number): Promise<Annotation[]> {
    await delay(200)
    return mockStore.annotations.filter(a => a.documentId === documentId)
  },

  async createAnnotation(documentId: number, data: {
    entity: string
    entityType: EntityType
    startPos: number
    endPos: number
  }): Promise<Annotation> {
    await delay(300)
    const newAnnotation: Annotation = {
      id: Math.max(...mockStore.annotations.map(a => a.id), 0) + 1,
      documentId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockStore.annotations.push(newAnnotation)
    return newAnnotation
  },

  async updateAnnotation(id: number, data: Partial<Annotation>): Promise<Annotation> {
    await delay(200)
    const index = mockStore.annotations.findIndex(a => a.id === id)
    if (index === -1) throw new Error('标注不存在')
    const existing = mockStore.annotations[index]
    if (!existing) throw new Error('标注不存在')
    const updated: Annotation = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString()
    }
    mockStore.annotations[index] = updated
    return updated
  },

  async deleteAnnotation(id: number): Promise<void> {
    await delay(200)
    const index = mockStore.annotations.findIndex(a => a.id === id)
    if (index === -1) throw new Error('标注不存在')
    mockStore.annotations.splice(index, 1)
  },

  // AI 标注
  async autoAnnotate(documentId: number): Promise<Annotation[]> {
    await delay(1500)
    const document = mockStore.documents.find(d => d.id === documentId)
    if (!document || !document.content) return []

    const newAnnotations: Annotation[] = []
    const content = document.content

    // 简单的关键词匹配
    const patterns: { pattern: RegExp; type: EntityType }[] = [
      { pattern: /子曰/g, type: 'person' },
      { pattern: /孔子/g, type: 'person' },
      { pattern: /君子/g, type: 'concept' },
      { pattern: /诗/g, type: 'concept' },
    ]

    let currentId = Math.max(...mockStore.annotations.map(a => a.id), 0) + 1

    patterns.forEach(({ pattern, type }) => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const existing = mockStore.annotations.find(
          a => a.documentId === documentId &&
               a.startPos === match!.index &&
               a.endPos === match!.index + match![0].length
        )
        if (!existing) {
          const annotation: Annotation = {
            id: currentId++,
            documentId,
            entity: match[0],
            entityType: type,
            startPos: match.index,
            endPos: match.index + match[0].length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          mockStore.annotations.push(annotation)
          newAnnotations.push(annotation)
        }
      }
    })

    return newAnnotations
  },

  // AI 问答
  async askQuestion(question: string): Promise<string> {
    await delay(2000)

    if (question.includes('论语') || question.includes('学而')) {
      return '这句话出自《论语·学而》篇首，是孔子关于学习的重要论述。"学而时习之"强调学习与实践的结合，"有朋自远方来"体现了儒家对友谊的重视，"人不知而不愠"则展示了君子应有的胸怀与修养。'
    }

    if (question.includes('诗经')) {
      return '《诗经》是中国最早的诗歌总集，收录了从西周初年到春秋中叶（约前11世纪至前6世纪）的诗歌305篇。它分为"风"、"雅"、"颂"三部分，反映了当时的社会生活、情感世界和文化风貌。'
    }

    if (question.includes('翻译') || question.includes('现代')) {
      return '这段古文的意思是：[AI自动翻译] 将古代汉语转化为现代白话文，帮助读者理解原文含义。'
    }

    return '感谢您的提问。根据古文智能分析系统，这段文字的主要含义是：[系统正在学习更多内容以提供更准确的回答]'
  }
}

export default mockApi
