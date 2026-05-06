<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { mockApi } from '@/api/mock'
import { aiApi } from '@/api'
import type { Document, Annotation, EntityType } from '@/api/types'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt()

const renderAiMessageHtml = (text: string) => {
  return DOMPurify.sanitize(md.render(text))
}

const route = useRoute()

// SVG 图标
const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`

const projectId = computed(() => Number(route.params.projectId))
const documentId = computed(() => Number(route.params.documentId))

type DocumentWithAnnotations = Document & { annotations?: Annotation[] }

const document = ref<Document | null>(null)
const annotations = ref<Annotation[]>([])
const sortedAnnotations = computed(() => {
  return [...annotations.value].sort((a, b) => (a.startPos || 0) - (b.startPos || 0))
})
const isLoading = ref(true)
const activeTab = ref('annotation')
const isAnnotating = ref(false)
const selectedEntityType = ref<string>('person')
const newAnnotationText = ref('')
const matchPositions = ref<{ start: number; end: number }[]>([])

const question = ref('')
const aiMessages = ref<{ type: 'user' | 'ai'; text: string }[]>([])
const isAiLoading = ref(false)

// 快速提问选项
const quickQuestions = [
  '翻译成现代汉语',
  '标注文中人名地名',
  '解释重点词汇'
]

// 快速提问
const askAiQuestionWith = (q: string) => {
  question.value = q
  askAiQuestion()
}

// 古文解析相关状态
const isParsing = ref(false)
const parsedResult = ref<{ sentence: string; grammar: string; meaning: string } | null>(null)
const parsingQuestion = ref('')
const parsingMessages = ref<{ type: 'user' | 'ai'; text: string }[]>([])
const isParsingLoading = ref(false)

const parsingQuickQuestions = [
  '解释语法结构',
  '分析句式特点',
  '解读关键词语'
]

// 自动分词相关状态
const isTokenizing = ref(false)
const tokenizeResult = ref<{ word: string; pos: string }[]>([])
const tokenizeQuestion = ref('')
const tokenizeMessages = ref<{ type: 'user' | 'ai'; text: string }[]>([])
const isTokenizingLoading = ref(false)

const tokenizeQuickQuestions = [
  '解释词性标注',
  '分析词语搭配',
  '说明分词依据'
]

// 默认实体类型
const defaultEntityTypes = [
  { value: 'person', label: '人物', color: '#e74c3c' },
  { value: 'location', label: '地名', color: '#3498db' },
  { value: 'time', label: '时间', color: '#9b59b6' },
  { value: 'concept', label: '概念', color: '#2ecc71' },
  { value: 'other', label: '其他', color: '#95a5a6' }
]

// 实体类型管理
const entityTypes = ref<{ value: string; label: string; color: string }[]>([...defaultEntityTypes])

// 加载保存的实体类型
const loadEntityTypes = () => {
  const saved = localStorage.getItem('entityTypes')
  if (saved) {
    try {
      entityTypes.value = JSON.parse(saved)
    } catch {
      entityTypes.value = [...defaultEntityTypes]
    }
  }
}

// 保存实体类型
const saveEntityTypes = () => {
  localStorage.setItem('entityTypes', JSON.stringify(entityTypes.value))
}

// 实体类型管理弹窗
// 获取实体类型信息
const getEntityTypeInfo = (type: string) => {
  return entityTypes.value.find(t => t.value === type) || { label: type, color: '#95a5a6' }
}

// 内联添加实体类型
const showAddType = ref(false)
const newTypeName = ref('')
const newTypeColor = ref('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'))

const toggleAddType = () => {
  showAddType.value = !showAddType.value
  if (showAddType.value) {
    newTypeName.value = ''
    newTypeColor.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
  }
}

const addEntityTypeInline = () => {
  if (!newTypeName.value.trim()) return
  const value = newTypeName.value.trim().toLowerCase().replace(/\s+/g, '_')
  if (entityTypes.value.some(t => t.value === value)) {
    alert('该类型已存在')
    return
  }
  entityTypes.value.push({
    value,
    label: newTypeName.value.trim(),
    color: newTypeColor.value
  })
  saveEntityTypes()
  showAddType.value = false
}

const loadData = async () => {
  isLoading.value = true
  try {
    const data = await mockApi.getDocument(documentId.value)
    if (data) {
      document.value = data
      // 如果后端返回的数据中包含标注，则使用后端的数据
      const documentWithAnnotations = data as DocumentWithAnnotations
      if (documentWithAnnotations.annotations) {
        annotations.value = documentWithAnnotations.annotations
      } else {
        annotations.value = await mockApi.getAnnotations(documentId.value)
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleAutoAnnotate = async () => {
  if (!document.value?.content) return
  isAnnotating.value = true
  try {
    const suggestions = await aiApi.autoAnnotate(document.value.content)
    const newAnns: Annotation[] = []
    
    for (const item of suggestions) {
      const text = item.entity
      const content = document.value.content
      const start = content.indexOf(text)
      
      if (start !== -1) {
        try {
          const ann = await mockApi.createAnnotation(documentId.value, {
            entity: text,
            entityType: (item.entity_type as EntityType) || 'other',
            startPos: start,
            endPos: start + text.length
          })
          newAnns.push(ann)
        } catch {
          // 跳过已存在的
        }
      }
    }
    
    if (newAnns.length > 0) {
      annotations.value = [...annotations.value, ...newAnns]
      alert(`AI 自动标注完成，新增 ${newAnns.length} 条标注`)
    } else {
      alert('AI 未能识别出新的实体')
    }
  } catch (error) {
    console.error('自动标注失败:', error)
    alert('AI 自动标注失败')
  } finally {
    isAnnotating.value = false
  }
}

const handleSave = async () => {
  if (!document.value) return

  try {
    await mockApi.updateDocument(documentId.value, {
      content: document.value.content || ''
    })
    alert('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  }
}

const handleAddAnnotation = () => {
  const text = newAnnotationText.value.trim()
  if (!text || !document.value?.content) return

  const content = document.value.content
  const positions: { start: number; end: number }[] = []
  let startIndex = 0

  while (startIndex < content.length) {
    const index = content.indexOf(text, startIndex)
    if (index === -1) break
    positions.push({ start: index, end: index + text.length })
    startIndex = index + 1
  }

  matchPositions.value = positions
  if (positions.length === 0) {
    alert(`未在文本中找到"${text}"`)
  }
}

const addAnnotationAtPosition = async (start: number, end: number) => {
  const text = newAnnotationText.value.trim()
  if (!text) return

  try {
    const newAnnotation = await mockApi.createAnnotation(documentId.value, {
      entity: text,
      entityType: selectedEntityType.value as EntityType,
      startPos: start,
      endPos: end
    })
    annotations.value.push(newAnnotation)
    // 如果只有一处匹配，添加后直接清除
    if (matchPositions.value.length === 1) {
      newAnnotationText.value = ''
      matchPositions.value = []
    } else {
      // 否则只移除当前匹配项
      matchPositions.value = matchPositions.value.filter(p => p.start !== start)
    }
  } catch (error) {
    console.error('添加标注失败:', error)
  }
}

const confirmAddAnnotations = async () => {
  const text = newAnnotationText.value.trim()
  if (!text || matchPositions.value.length === 0) return

  try {
    const newAnnotations = await mockApi.createAnnotationsBulk(documentId.value, matchPositions.value.map(pos => ({
      entity: text,
      entityType: selectedEntityType.value as EntityType,
      startPos: pos.start,
      endPos: pos.end
    })))
    annotations.value = [...annotations.value, ...newAnnotations]
    newAnnotationText.value = ''
    matchPositions.value = []
  } catch (error) {
    console.error('批量添加标注失败:', error)
    alert('批量添加失败')
  }
}

const handleDeleteAnnotation = async (id: number) => {
  if (!confirm('确定要删除这条标注吗？')) return

  try {
    await mockApi.deleteAnnotation(id)
    annotations.value = annotations.value.filter(a => a.id !== id)
  } catch (error) {
    console.error('删除标注失败:', error)
  }
}

const askAiQuestion = async () => {
  const q = question.value.trim()
  if (!q || !document.value) return

  aiMessages.value.push({ type: 'user', text: q })
  question.value = ''
  isAiLoading.value = true

  try {
    const history = aiMessages.value.slice(0, -1).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text
    }))
    
    const answer = await aiApi.aiChat({
      text: document.value.content || '',
      question: q,
      history
    })

    aiMessages.value.push({ type: 'ai', text: answer })
    // 自动滚动到底部 (侧边栏)
    nextTick(() => {
      const sidebar = window.document.querySelector<HTMLElement>('.editor-sidebar')
      if (sidebar) {
        sidebar.scrollTop = sidebar.scrollHeight
      }
    })
  } catch (error) {
    console.error('AI Q&A failed:', error)
    aiMessages.value.push({ type: 'ai', text: '抱歉，AI助手暂时无法回答这个问题，请稍后再试。' })
  } finally {
    isAiLoading.value = false
  }
}

// 古文解析处理
const handleParsing = async () => {
  if (!document.value?.content) {
    alert('请先输入古文内容')
    return
  }
  isParsing.value = true

  try {
    const result = await aiApi.analyzeText(document.value.content)
    parsedResult.value = result
  } catch (error) {
    console.error('解析失败:', error)
    alert('AI解析失败，请检查网络或稍后再试')
  } finally {
    isParsing.value = false
  }
}

const askParsingQuestionWith = (q: string) => {
  parsingQuestion.value = q
  askParsingQuestion()
}

const askParsingQuestion = async () => {
  const q = parsingQuestion.value.trim()
  if (!q || !document.value) return

  parsingMessages.value.push({ type: 'user', text: q })
  parsingQuestion.value = ''
  isParsingLoading.value = true

  try {
    const history = parsingMessages.value.slice(0, -1).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text
    }))

    const answer = await aiApi.aiChat({
      text: document.value.content || '',
      question: q,
      history
    })

    parsingMessages.value.push({ type: 'ai', text: answer })
    // 自动滚动到底部 (侧边栏)
    nextTick(() => {
      const sidebar = window.document.querySelector<HTMLElement>('.editor-sidebar')
      if (sidebar) {
        sidebar.scrollTop = sidebar.scrollHeight
      }
    })
  } catch (error) {
    console.error('Parsing Q&A failed:', error)
    parsingMessages.value.push({ type: 'ai', text: '抱歉，暂时无法回答这个问题。' })
  } finally {
    isParsingLoading.value = false
  }
}

// 自动分词处理
const handleTokenize = async () => {
  if (!document.value?.content) {
    alert('请先输入古文内容')
    return
  }
  isTokenizing.value = true

  try {
    const result = await aiApi.tokenizeText(document.value.content)
    tokenizeResult.value = result
  } catch (error) {
    console.error('分词失败:', error)
    alert('分词失败，请稍后再试')
  } finally {
    isTokenizing.value = false
  }
}

const askTokenizeQuestionWith = (q: string) => {
  tokenizeQuestion.value = q
  askTokenizeQuestion()
}

const askTokenizeQuestion = async () => {
  const q = tokenizeQuestion.value.trim()
  if (!q) return

  tokenizeMessages.value.push({ type: 'user', text: q })
  tokenizeQuestion.value = ''
  isTokenizingLoading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    let answer = ''
    if (q.includes('词性')) {
      answer = '词性标注说明：\n\n• **名**：名词，表示人、事物、地点\n• **动**：动词，表示动作或状态变化\n• **形**：形容词，表示性质或状态\n• **代**：代词，代替名词或其他词\n• **副**：副词，修饰动词或形容词\n• **介**：介词，引出对象或方式\n• **连**：连词，连接词语或句子\n• **助**：助词，帮助表达语气'
    } else if (q.includes('搭配')) {
      answer = '词语搭配分析：\n\n古文中常见的词语搭配包括：\n\n• 主谓搭配：主语+谓语动词\n• 动宾搭配：动词+宾语\n• 偏正搭配：修饰语+中心语\n• 联合搭配：并列词语组合\n\n这些搭配关系对于理解句意至关重要。'
    } else if (q.includes('分词') || q.includes('依据')) {
      answer = '分词依据说明：\n\n1. **语义完整性**：每个词应表达相对完整的意义\n2. **语法功能**：考虑词在句中的语法作用\n3. **语境关联**：结合上下文确定词语边界\n4. **传统习惯**：参考权威辞书和专家注疏'
    } else {
      answer = tokenizeResult.value.length > 0
        ? `当前分词结果显示，共有 ${tokenizeResult.value.length} 个词单元。主要涉及名词、动词、形容词等词性，具体词性标注已在上方展示。`
        : '请先点击"开始分词"按钮进行分析，再针对具体内容提问。'
    }

    tokenizeMessages.value.push({ type: 'ai', text: answer })
  } catch {
    tokenizeMessages.value.push({ type: 'ai', text: '抱歉，暂时无法回答这个问题。' })
  } finally {
    isTokenizingLoading.value = false
  }
}

onMounted(() => {
  loadEntityTypes()
  loadData()
})
</script>

<template>
  <div class="editor-page">
    <div class="page-bg"></div>

    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="container">
        <div class="header-inner">
          <router-link to="/" class="header-brand">
            <div class="brand-icon" v-html="brandIcon"></div>
            <span>古文智注</span>
          </router-link>
          <nav class="header-nav">
            <router-link to="/projects" class="nav-link">项目管理</router-link>
            <span class="nav-separator">/</span>
            <router-link :to="`/projects/${projectId}/documents`" class="nav-link">文档列表</router-link>
            <span class="nav-separator">/</span>
            <span class="nav-current">{{ document?.title || '加载中...' }}</span>
          </nav>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
    </div>

    <!-- 编辑器主体 -->
    <main v-else class="editor-main">
      <div class="container">
        <div class="editor-layout">
          <!-- 主编辑器区域 -->
          <div class="editor-content">
            <!-- 工具栏 -->
            <div class="editor-toolbar">
              <div class="tabs">
                <button
                  :class="['tab', { active: activeTab === 'annotation' }]"
                  @click="activeTab = 'annotation'"
                >
                  实体标注
                </button>
                <button
                  :class="['tab', { active: activeTab === 'parsing' }]"
                  @click="activeTab = 'parsing'"
                >
                  古文解析
                </button>
                <button
                  :class="['tab', { active: activeTab === 'tokenize' }]"
                  @click="activeTab = 'tokenize'"
                >
                  自动分词
                </button>
              </div>
              <button class="btn primary" @click="handleSave">
                保存文档
              </button>
            </div>

            <!-- 文本编辑区 -->
            <div class="text-editor">
              <textarea
                v-model="document!.content"
                class="text-area"
                placeholder="请输入或粘贴古文内容..."
              ></textarea>
              <div class="text-hint">
                <span>在右侧选择功能进行实体标注、古文解析或自动分词</span>
              </div>
            </div>
          </div>

          <!-- 侧边栏 -->
          <aside class="editor-sidebar">
            <!-- 标注面板 -->
            <div v-if="activeTab === 'annotation'" class="sidebar-panel">
              <h4>添加标注</h4>
              <p class="panel-desc">输入实体名称，程序会自动查找文本中的匹配位置</p>

              <div class="annotation-form">
                <div class="form-group">
                  <label>实体类型</label>
                  <div class="entity-types-inline">
                    <button
                      v-for="type in entityTypes"
                      :key="type.value"
                      :class="['chip small', { active: selectedEntityType === type.value }]"
                      :style="selectedEntityType === type.value ? { background: type.color, borderColor: type.color } : {}"
                      @click="selectedEntityType = type.value"
                    >
                      {{ type.label }}
                    </button>
                    <div v-if="showAddType" class="add-type-inline">
                      <input
                        v-model="newTypeName"
                        type="text"
                        class="input small"
                        placeholder="名称"
                        @keyup.enter="addEntityTypeInline"
                      />
                      <input v-model="newTypeColor" type="color" class="color-input-sm" />
                      <button class="btn primary small" @click="addEntityTypeInline">✓</button>
                      <button class="btn ghost small" @click="showAddType = false">×</button>
                    </div>
                    <button v-else class="btn ghost small" @click="toggleAddType" title="添加类型"><span v-html="plusIcon"></span></button>
                  </div>
                </div>

                <div class="form-group">
                  <label>实体名称</label>
                  <input
                    v-model="newAnnotationText"
                    type="text"
                    class="input"
                    placeholder="输入要标注的文字..."
                    @keyup.enter="handleAddAnnotation"
                  />
                </div>

                <div v-if="matchPositions.length > 0" class="match-info">
                  <p>找到 {{ matchPositions.length }} 处匹配：</p>
                  <div class="match-list">
                    <button
                      v-for="(pos, idx) in matchPositions"
                      :key="idx"
                      class="btn ghost small full"
                      @click="addAnnotationAtPosition(pos.start, pos.end)"
                    >
                      第 {{ idx + 1 }} 处：位置 {{ pos.start }}-{{ pos.end }}
                    </button>
                  </div>
                  <button class="btn primary full mt-10" @click="confirmAddAnnotations">
                    确认添加全部
                  </button>
                  <button class="btn ghost full mt-5" @click="matchPositions = []">
                    取消
                  </button>
                </div>

                <button v-else class="btn primary full" @click="handleAddAnnotation">
                  查找匹配
                </button>
              </div>

              <button
                class="btn ghost full"
                :disabled="isAnnotating"
                @click="handleAutoAnnotate"
              >
                {{ isAnnotating ? '标注中...' : 'AI 自动标注' }}
              </button>

              <div class="annotations-list">
                <h5>已有标注 ({{ annotations.length }})</h5>
                <div v-if="annotations.length === 0" class="no-annotations">
                  暂无标注，点击上方按钮添加
                </div>
                <template v-for="ann in sortedAnnotations" :key="ann.id">
                  <div class="annotation-item">
                    <div class="ann-header">
                      <span
                        class="ann-type"
                        :style="{ background: getEntityTypeInfo(ann.entityType).color }"
                      >
                        {{ getEntityTypeInfo(ann.entityType).label }}
                      </span>
                      <button class="ann-delete" @click="handleDeleteAnnotation(ann.id)">×</button>
                    </div>
                    <div class="ann-entity">{{ ann.entity }}</div>
                    <div class="ann-position">位置: {{ ann.startPos }}-{{ ann.endPos }}</div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 古文解析面板 -->
            <div v-else-if="activeTab === 'parsing'" class="sidebar-panel">
              <h4>古文解析</h4>
              <p class="panel-desc">基于NLP的古文智能断句与语法分析</p>

              <button class="btn primary full" @click="handleParsing">
                {{ isParsing ? '解析中...' : '开始解析' }}
              </button>

              <div class="parsing-result">
                <h5>解析结果</h5>
                <div v-if="parsedResult" class="parsed-analysis">
                  <div class="analysis-section">
                    <h6>📖 断句分析</h6>
                    <p>{{ parsedResult.sentence }}</p>
                  </div>
                  <div class="analysis-section">
                    <h6>📝 语法结构</h6>
                    <p>{{ parsedResult.grammar }}</p>
                  </div>
                  <div class="analysis-section">
                    <h6>💡 语义解读</h6>
                    <p>{{ parsedResult.meaning }}</p>
                  </div>
                </div>
                <div v-else class="no-result">
                  点击"开始解析"按钮进行古文分析
                </div>
              </div>

              <div class="ai-chat-section">
                <h5>AI 问答</h5>
                <div class="ai-messages">
                  <div
                    v-for="(msg, index) in parsingMessages"
                    :key="index"
                    :class="['ai-message', msg.type]"
                  >
                    <div v-if="msg.type === 'ai'" v-html="renderAiMessageHtml(msg.text)"></div>
                    <template v-else>{{ msg.text }}</template>
                  </div>
                  <div v-if="isParsingLoading" class="ai-message ai loading">
                    <span class="loading-dots">思考中</span>
                  </div>
                  <div v-if="parsingMessages.length === 0 && !isParsingLoading" class="ai-empty">
                    您好！可以问我关于古文解析的问题。
                  </div>
                </div>
                <div class="quick-questions">
                  <span>快速提问</span>
                  <button
                    v-for="q in parsingQuickQuestions"
                    :key="q"
                    class="chip small"
                    @click="askParsingQuestionWith(q)"
                  >
                    {{ q }}
                  </button>
                </div>
                <div class="ai-input">
                  <input
                    v-model="parsingQuestion"
                    type="text"
                    placeholder="输入关于解析的问题..."
                    @keyup.enter="askParsingQuestion"
                  />
                  <button class="btn primary" @click="askParsingQuestion" :disabled="isParsingLoading">
                    发送
                  </button>
                </div>
              </div>
            </div>

            <!-- 自动分词面板 -->
            <div v-else-if="activeTab === 'tokenize'" class="sidebar-panel">
              <h4>自动分词</h4>
              <p class="panel-desc">基于NLP的智能分词与词性标注</p>

              <button class="btn primary full" @click="handleTokenize">
                {{ isTokenizing ? '分词中...' : '开始分词' }}
              </button>

              <div class="tokenize-result">
                <h5>分词结果</h5>
                <div v-if="tokenizeResult.length > 0" class="token-list">
                  <span
                    v-for="(token, index) in tokenizeResult"
                    :key="index"
                    class="token-item"
                    :class="token.pos"
                  >
                    {{ token.word }}
                    <span class="token-pos">{{ token.pos }}</span>
                  </span>
                </div>
                <div v-else class="no-result">
                  点击"开始分词"按钮进行智能分词
                </div>
              </div>

              <div class="ai-chat-section">
                <h5>AI 问答</h5>
                <div class="ai-messages">
                  <div
                    v-for="(msg, index) in tokenizeMessages"
                    :key="index"
                    :class="['ai-message', msg.type]"
                  >
                    <div v-if="msg.type === 'ai'" v-html="renderAiMessageHtml(msg.text)"></div>
                    <template v-else>{{ msg.text }}</template>
                  </div>
                  <div v-if="isTokenizingLoading" class="ai-message ai loading">
                    <span class="loading-dots">思考中</span>
                  </div>
                  <div v-if="tokenizeMessages.length === 0 && !isTokenizingLoading" class="ai-empty">
                    您好！可以问我关于分词和词性的问题。
                  </div>
                </div>
                <div class="quick-questions">
                  <span>快速提问</span>
                  <button
                    v-for="q in tokenizeQuickQuestions"
                    :key="q"
                    class="chip small"
                    @click="askTokenizeQuestionWith(q)"
                  >
                    {{ q }}
                  </button>
                </div>
                <div class="ai-input">
                  <input
                    v-model="tokenizeQuestion"
                    type="text"
                    placeholder="输入关于分词的问题..."
                    @keyup.enter="askTokenizeQuestion"
                  />
                  <button class="btn primary" @click="askTokenizeQuestion" :disabled="isTokenizingLoading">
                    发送
                  </button>
                </div>
              </div>
            </div>

            <!-- AI问答面板 -->
            <div v-else class="sidebar-panel ai-panel">
              <h4>AI 智能助手</h4>
              <div class="ai-messages">
                <div
                  v-for="(msg, index) in aiMessages"
                  :key="index"
                  :class="['ai-message', msg.type]"
                >
                  <div v-if="msg.type === 'ai'" v-html="renderAiMessageHtml(msg.text)"></div>
                  <template v-else>{{ msg.text }}</template>
                </div>
                <div v-if="isAiLoading" class="ai-message ai loading">
                  <span class="loading-dots">思考中</span>
                </div>
                <div v-if="aiMessages.length === 0 && !isAiLoading" class="ai-empty">
                  您好！我是古文智能助手，可以帮您分析当前文档内容、解答相关问题。
                </div>
              </div>
              <div class="quick-questions">
                <span>快速提问</span>
                <button
                  v-for="q in quickQuestions"
                  :key="q"
                  class="chip small"
                  @click="askAiQuestionWith(q)"
                >
                  {{ q }}
                </button>
              </div>
              <div class="ai-input">
                <input
                  v-model="question"
                  type="text"
                  placeholder="输入关于本文的问题..."
                  @keyup.enter="askAiQuestion"
                />
                <button class="btn primary" @click="askAiQuestion" :disabled="isAiLoading">
                  发送
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.editor-page {
  min-height: 100vh;
  padding-bottom: 40px;
}

/* 顶部导航 */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--edge);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, var(--ink), var(--ink-soft));
  color: var(--accent);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-link {
  color: var(--ink);
  font-size: 14px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--ink-soft);
}

.nav-separator {
  color: var(--edge);
}

.nav-current {
  color: var(--ink-soft);
  font-size: 14px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 加载 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* 编辑器布局 */
.editor-main {
  padding-top: 24px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: stretch; /* 让左右两边拉伸到一样高 */
  height: calc(100vh - 180px); /* 减去顶部导航和内边距的高度 */
  min-height: 600px;
}

/* 编辑器内容 */
.editor-content {
  background: var(--white);
  border: 1px solid var(--edge);
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--edge);
  background: var(--paper);
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab {
  border-radius: 999px;
  border: 1px solid var(--edge);
  padding: 8px 16px;
  font-size: 14px;
  background: var(--white);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  border-color: var(--ink-soft);
}

.tab.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.text-editor {
  padding: 20px;
  flex: 1;
  overflow-y: auto; /* 左侧内容超出时滚动 */
}

.text-area {
  width: 100%;
  min-height: 100%; /* 占满剩余空间 */
  border: 1px solid var(--edge);
  border-radius: var(--radius-lg);
  background: var(--paper);
  padding: 16px;
  font-family: var(--font-serif);
  font-size: 18px;
  line-height: 2;
  resize: none; /* 禁用手动调整大小，由布局控制 */
  color: var(--ink);
}

.text-area:focus {
  outline: none;
  border-color: var(--ink-soft);
  box-shadow: 0 0 0 3px rgba(74, 124, 38, 0.1);
}

.text-hint {
  margin-top: 12px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 13px;
}

/* 侧边栏 */
.editor-sidebar {
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 侧边栏整体滚动 */
  padding-right: 4px; /* 为滚动条留一点空间 */
}

/* 自定义侧边栏滚动条 */
.editor-sidebar::-webkit-scrollbar {
  width: 6px;
}

.editor-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.editor-sidebar::-webkit-scrollbar-thumb {
  background: var(--edge);
  border-radius: 3px;
}

.editor-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--ink-soft);
}

.sidebar-panel {
  background: var(--white);
  border: 1px solid var(--edge);
  border-radius: var(--radius-xl);
  padding: 20px;
  flex-shrink: 0; /* 防止面板被压缩 */
}

.sidebar-panel h4 {
  font-size: 18px;
  margin-bottom: 8px;
}

.panel-desc {
  color: var(--ink-soft);
  font-size: 13px;
  margin-bottom: 16px;
}

.entity-types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--edge);
  border-radius: 999px;
  background: var(--white);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--ink);
}

.chip:hover {
  border-color: var(--ink-soft);
}

.chip.active {
  color: #fff;
}

.chip.small {
  padding: 4px 10px;
  font-size: 12px;
}

.annotation-form {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--ink-soft);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--edge);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--paper);
  color: var(--ink);
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--ink-soft);
  box-shadow: 0 0 0 3px rgba(74, 124, 38, 0.1);
}

.match-info {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--paper);
  border-radius: var(--radius-md);
}

.match-info p {
  font-size: 13px;
  color: var(--ink-soft);
  margin-bottom: 8px;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mt-10 {
  margin-top: 10px;
}

.mt-5 {
  margin-top: 5px;
}

.full {
  width: 100%;
}

.btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.full {
  width: 100%;
  margin-bottom: 12px;
}

.annotations-list {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--edge);
}

.annotations-list h5 {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--ink-soft);
}

.no-annotations {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}

.annotation-item {
  background: var(--paper);
  border: 1px solid var(--edge);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 8px;
}

.ann-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.ann-type {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
}

.ann-delete {
  border: 0;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
}

.ann-delete:hover {
  color: #e74c3c;
}

.ann-entity {
  font-family: var(--font-serif);
  font-size: 16px;
  margin-bottom: 4px;
}

.ann-position {
  font-size: 11px;
  color: var(--text-muted);
}

/* AI面板 */
.ai-panel {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.ai-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--edge);
  border-radius: var(--radius-md);
  background: var(--paper);
  padding: 16px;
  margin-bottom: 16px;
}

.ai-message {
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-message :deep(p) {
  margin: 0 0 8px 0;
}

.ai-message :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-message :deep(strong) {
  font-weight: 700;
  color: var(--ink);
}

.ai-message :deep(ul), .ai-message :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.ai-message :deep(li) {
  margin-bottom: 4px;
}

.ai-message.user {
  background: var(--ink);
  color: #fff;
  margin-left: 20%;
}

.ai-message.ai {
  background: var(--paper);
  border: 1px solid var(--edge);
}

.ai-message.loading {
  color: var(--ink-soft);
  font-style: italic;
}

.ai-input {
  display: flex;
  gap: 8px;
}

.ai-input input {
  flex: 1;
  border: 1px solid var(--edge);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 14px;
}

.ai-input input:focus {
  outline: none;
  border-color: var(--ink-soft);
}

/* 响应式 */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .editor-sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .tabs {
    flex-wrap: wrap;
    justify-content: center;
  }

  .text-area {
    min-height: 300px;
    font-size: 16px;
  }
}

/* 实体类型内联添加样式 */
.entity-types-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.add-type-inline {
  display: flex;
  gap: 6px;
  align-items: center;
}

.add-type-inline .input {
  width: 80px;
  padding: 6px 10px;
}

.color-input-sm {
  width: 28px;
  height: 28px;
  padding: 2px;
  border: 1px solid var(--edge);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: white;
}

/* 古文解析面板样式 */
.ai-empty {
  padding: 20px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.6;
}

.quick-questions {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-top: 1px solid var(--edge);
  background: var(--paper);
}

.quick-questions span {
  color: var(--ink-soft);
  font-size: 13px;
}

.loading-dots::after {
  content: '';
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

/* 古文解析面板样式 */
.panel-desc {
  font-size: 13px;
  color: var(--ink-soft);
  margin-bottom: 16px;
  line-height: 1.5;
}

.parsing-result,
.tokenize-result {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--edge);
}

.parsing-result h5,
.tokenize-result h5 {
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 12px;
}

.parsed-analysis {
  background: var(--paper);
  border-radius: var(--radius-md);
  padding: 16px;
}

.analysis-section {
  margin-bottom: 16px;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.analysis-section h6 {
  font-size: 13px;
  color: var(--ink-soft);
  margin-bottom: 6px;
}

.analysis-section p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink);
}

.no-result {
  text-align: center;
  padding: 20px;
  color: var(--ink-soft);
  font-size: 14px;
  background: var(--paper);
  border-radius: var(--radius-md);
}

/* 自动分词面板样式 */
.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--paper);
  border-radius: var(--radius-md);
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.token-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--white);
  border: 1px solid var(--edge);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: var(--font-serif);
}

.token-pos {
  font-size: 10px;
  color: var(--ink-soft);
  background: var(--paper);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--font-sans);
}

.token-item.名 { border-color: #3498db; }
.token-item.动 { border-color: #e74c3c; }
.token-item.形 { border-color: #2ecc71; }
.token-item.代 { border-color: #9b59b6; }
.token-item.副 { border-color: #f39c12; }
.token-item.介 { border-color: #1abc9c; }
.token-item.连 { border-color: #34495e; }
.token-item.助 { border-color: #95a5a6; }
.token-item.叹 { border-color: #e91e63; }
.token-item.量 { border-color: #00bcd4; }

/* AI聊天区域 */
.ai-chat-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--edge);
}

.ai-chat-section h5 {
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 12px;
}

.ai-chat-section .ai-messages {
  max-height: 200px;
}

.ai-chat-section .quick-questions {
  margin: 12px 0;
}
</style>
