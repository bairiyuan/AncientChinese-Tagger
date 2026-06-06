<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { mockApi } from '@/api/mock'
import type { Document, Project } from '@/api/types'

const router = useRouter()
const route = useRoute()

// SVG 图标
const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`

const searchIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`

const docIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`

const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`

const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`

const projectId = computed(() => Number(route.params.projectId))

const project = ref<Project | null>(null)
const documents = ref<Document[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showMenuFor = ref<number | null>(null)
const menuPosition = ref({ x: 0, y: 0 })
const currentDoc = ref<Document | null>(null)
const editDocTitle = ref('')

const newDocument = ref({
  title: '',
  content: ''
})

const filteredDocuments = computed(() => {
  if (!searchQuery.value) return documents.value
  const query = searchQuery.value.toLowerCase()
  return documents.value.filter(d =>
    (d.title && d.title.toLowerCase().includes(query)) ||
    (d.content && d.content.toLowerCase().includes(query))
  )
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [projectData, docsData] = await Promise.all([
      mockApi.getProject(projectId.value),
      mockApi.getDocuments(projectId.value)
    ])
    project.value = projectData || null
    documents.value = docsData
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCreateDocument = async () => {
  if (!newDocument.value.title.trim()) return

  try {
    const created = await mockApi.createDocument(projectId.value, {
      title: newDocument.value.title,
      content: newDocument.value.content
    })
    documents.value.unshift(created)
    showCreateModal.value = false
    newDocument.value = { title: '', content: '' }
  } catch (error) {
    console.error('创建文档失败:', error)
  }
}

const goToEditor = (documentId: number) => {
  router.push(`/projects/${projectId.value}/documents/${documentId}`)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  loadData()
})

// 显示菜单
const showMenu = (event: MouseEvent, doc: Document) => {
  event.stopPropagation()
  event.preventDefault()
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  menuPosition.value = {
    x: rect.right - 120,
    y: rect.bottom + 8
  }
  showMenuFor.value = doc.id
  currentDoc.value = doc
}

// 关闭菜单
const closeMenu = () => {
  showMenuFor.value = null
}

// 打开重命名模态框
const openRename = () => {
  if (!currentDoc.value) return
  editDocTitle.value = currentDoc.value.title || ''
  showMenuFor.value = null
  showRenameModal.value = true
}

// 处理重命名
const handleRename = async () => {
  if (!currentDoc.value || !editDocTitle.value.trim()) return
  try {
    const updated = await mockApi.updateDocument(currentDoc.value.id, {
      title: editDocTitle.value.trim()
    })
    const index = documents.value.findIndex(d => d.id === currentDoc.value!.id)
    if (index > -1) {
      documents.value[index] = { ...documents.value[index], ...updated }
    }
    showRenameModal.value = false
    editDocTitle.value = ''
    currentDoc.value = null
  } catch (error) {
    console.error('重命名文档失败:', error)
  }
}

// 点击其他地方关闭菜单
const handleGlobalClick = () => {
  if (showMenuFor.value) {
    closeMenu()
  }
}
</script>

<template>
  <div class="page" @click="handleGlobalClick">
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
            <span class="nav-current">{{ project?.name || '加载中...' }}</span>
          </nav>
        </div>
      </div>
    </header>

    <main class="page-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header-card">
          <div class="header-info">
            <div class="title-row">
              <h1>文档列表</h1>
            </div>
            <p>{{ project?.name || '项目文档' }}</p>
          </div>
          <div class="header-actions">
            <div class="search-box">
              <span class="search-icon" v-html="searchIcon"></span>
              <input
                v-model="searchQuery"
                type="text"
                class="input"
                placeholder="搜索文档..."
              />
            </div>
            <div class="action-buttons">
              <button class="btn ghost" @click="showCreateModal = true"><span v-html="plusIcon"></span>新建文档</button>
              <button class="btn primary"><span v-html="downloadIcon"></span>导出文档</button>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
        </div>

        <!-- 文档列表 -->
        <div v-if="filteredDocuments.length > 0" class="documents-list">
          <article
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="document-row"
            @click="goToEditor(doc.id)"
          >
            <div class="doc-left">
              <div class="doc-icon" v-html="docIcon"></div>
              <div class="doc-info">
                <h3>{{ doc.title }}</h3>
                <p class="doc-snippet">{{ doc.content?.slice(0, 100) }}...</p>
                <div class="doc-meta">
                  <span>创建于 {{ formatDate(doc.createdAt) }}</span>
                  <span>更新于 {{ formatDate(doc.updatedAt) }}</span>
                </div>
              </div>
            </div>
            <button class="more-btn" @click="showMenu($event, doc)">⋯</button>
          </article>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-state-icon" v-html="docIcon"></div>
          <h4 v-if="searchQuery">没有找到匹配的文档</h4>
          <h4 v-else>没有文档</h4>
          <p v-if="searchQuery">尝试调整搜索条件</p>
          <p v-else>创建第一个文档开始您的研究</p>
          <button class="btn primary" @click="showCreateModal = true">
            <span v-html="plusIcon"></span>新建文档
          </button>
        </div>

        <!-- 下拉菜单 -->
        <div 
          v-if="showMenuFor" 
          class="dropdown-menu"
          :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
        >
          <button class="dropdown-item" @click="openRename">
            <span v-html="editIcon"></span>
            重命名
          </button>
        </div>

        <!-- 跳转链接 -->
        <div class="jump-links">
          <router-link to="/projects" class="btn ghost">返回项目管理</router-link>
        </div>
      </div>
    </main>

    <!-- 创建文档弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建文档</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <form @submit.prevent="handleCreateDocument" class="modal-form">
          <div class="form-group">
            <label for="docTitle">文档标题</label>
            <input
              id="docTitle"
              v-model="newDocument.title"
              type="text"
              class="input"
              placeholder="请输入文档标题"
            />
          </div>
          <div class="form-group">
            <label for="docContent">文档内容</label>
            <textarea
              id="docContent"
              v-model="newDocument.content"
              class="input textarea"
              placeholder="请输入古文内容..."
              rows="6"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn ghost" @click="showCreateModal = false">
              取消
            </button>
            <button type="submit" class="btn primary">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 重命名文档弹窗 -->
    <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>重命名文档</h3>
          <button class="modal-close" @click="showRenameModal = false">×</button>
        </div>
        <form @submit.prevent="handleRename" class="modal-form">
          <div class="form-group">
            <label for="editDocTitle">文档标题</label>
            <input
              id="editDocTitle"
              v-model="editDocTitle"
              type="text"
              class="input"
              placeholder="请输入文档标题"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn ghost" @click="showRenameModal = false">
              取消
            </button>
            <button type="submit" class="btn primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 60px;
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
}

/* 页面内容 */
.page-content {
  padding-top: 32px;
}

.page-header-card {
  background: var(--white);
  border: 1px solid var(--edge);
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 24px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.header-info h1 {
  font-size: 36px;
  margin: 0;
}

.header-info p {
  color: var(--ink-soft);
  font-size: 14px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box .input {
  width: 100%;
  padding-left: 42px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-soft);
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 文档列表 */
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--white);
  border: 1px solid var(--edge);
  border-radius: var(--radius-xl);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.document-row:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.doc-left {
  display: flex;
  gap: 16px;
  flex: 1;
}

.doc-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, var(--ink), var(--ink-soft));
  color: var(--accent);
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-info h3 {
  font-size: 20px;
  margin-bottom: 6px;
}

.doc-snippet {
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.more-btn {
  border: 0;
  background: var(--paper);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  color: var(--ink-soft);
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

/* 跳转链接 */
.jump-links {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--edge);
}

/* 下拉菜单 */
.dropdown-menu {
  position: fixed;
  z-index: 1000;
  background: var(--paper);
  border: 1px solid var(--edge);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  min-width: 160px;
  padding: 8px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  color: var(--ink);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--paper-dark);
}

.dropdown-item.danger {
  color: var(--red);
}

.dropdown-item.danger:hover {
  background: var(--red-bg);
}

.dropdown-divider {
  height: 1px;
  background: var(--edge);
  margin: 8px 0;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--edge);
}

.modal-header h3 {
  font-size: 20px;
}

.modal-close {
  border: 0;
  background: none;
  font-size: 24px;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.modal-close:hover {
  background: var(--paper);
  color: var(--ink);
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--ink-soft);
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--edge);
  border-radius: var(--radius-lg);
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--ink-soft);
  background: var(--paper);
}

.upload-icon {
  font-size: 32px;
  color: var(--ink-soft);
  margin-bottom: 12px;
}

.upload-area p {
  color: var(--ink);
  font-size: 14px;
}

.upload-hint {
  color: var(--text-muted) !important;
  font-size: 12px !important;
  margin-top: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header-card {
    padding: 16px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .action-buttons {
    justify-content: flex-start;
  }

  .doc-left {
    flex-direction: column;
  }

  .doc-meta {
    flex-direction: column;
    gap: 4px;
  }

  .jump-links {
    flex-direction: column;
    gap: 12px;
  }
}

/* 回收站样式 */
.modal-lg {
  max-width: 640px;
}

.modal-body {
  max-height: 400px;
  overflow-y: auto;
  padding: 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--edge);
  display: flex;
  justify-content: flex-end;
}

.empty-state-sm {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.trash-list {
  display: flex;
  flex-direction: column;
}

.trash-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--edge);
}

.trash-item:last-child {
  border-bottom: none;
}

.trash-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trash-icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.trash-info h4 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.trash-info p {
  font-size: 12px;
  color: var(--text-muted);
}

.trash-actions {
  display: flex;
  gap: 8px;
}

.btn.danger {
  background: var(--red);
  color: var(--white);
  border-color: var(--red);
}

.btn.danger:hover {
  background: #a82825;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
