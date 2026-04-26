<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi } from '@/api/mock'
import type { Project } from '@/api/types'

const router = useRouter()

// SVG 图标
const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`

const searchIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`

const folderIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`

const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`

const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`

const exportIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`

const chartIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`

const docIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`

const annotationIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`

const moreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`

const restoreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`

const projects = ref<Project[]>([])
const trashedProjects = ref<Project[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const showCreateModal = ref(false)

// 下拉菜单状态
const showMenuFor = ref<number | null>(null)
const menuPosition = ref({ x: 0, y: 0 })

// 当前操作的项目
const currentProject = ref<Project | null>(null)

// 重命名模态框
const showRenameModal = ref(false)
const editProjectName = ref('')
const editProjectDesc = ref('')

// 统计模态框
const showStatsModal = ref(false)
const projectStats = ref({
  documentCount: 0,
  annotationCount: 0,
  entityCounts: {
    person: 0,
    location: 0,
    time: 0,
    concept: 0,
    other: 0
  }
})

// 删除确认
const showDeleteConfirm = ref(false)

// 回收站
const showTrashModal = ref(false)

const newProject = ref({
  name: '',
  description: ''
})

const filteredProjects = computed(() => {
  if (!searchQuery.value) return projects.value
  const query = searchQuery.value.toLowerCase()
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.description && p.description.toLowerCase().includes(query))
  )
})

// 实体类型配置
const entityTypes = [
  { key: 'person', label: '人物', color: '#e74c3c' },
  { key: 'location', label: '地名', color: '#3498db' },
  { key: 'time', label: '时间', color: '#9b59b6' },
  { key: 'concept', label: '概念', color: '#2ecc71' },
  { key: 'other', label: '其他', color: '#95a5a6' }
]

// 计算环形图数据
const chartSegments = computed(() => {
  const total = projectStats.value.annotationCount
  if (total === 0) return []
  
  const circumference = 2 * Math.PI * 40 // r = 40
  const segments: { color: string; dashArray: string; dashOffset: number }[] = []
  let offset = 25 // 从顶部开始
  
  entityTypes.forEach(entity => {
    const count = projectStats.value.entityCounts[entity.key as keyof typeof projectStats.value.entityCounts] as number
    if (count > 0) {
      const percent = (count / total) * 100
      const dashLength = (percent / 100) * circumference
      segments.push({
        color: entity.color,
        dashArray: `${dashLength} ${circumference}`,
        dashOffset: -offset
      })
      offset += dashLength
    }
  })
  
  return segments
})

// 图例数据
const entityLegend = computed(() => {
  const total = projectStats.value.annotationCount
  return entityTypes.map(entity => {
    const count = projectStats.value.entityCounts[entity.key as keyof typeof projectStats.value.entityCounts] as number
    return {
      type: entity.key,
      label: entity.label,
      color: entity.color,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    }
  })
})

const loadProjects = async () => {
  isLoading.value = true
  try {
    projects.value = await mockApi.getProjects()
  } catch (error) {
    console.error('加载项目失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCreateProject = async () => {
  if (!newProject.value.name.trim()) return

  try {
    const created = await mockApi.createProject({
      name: newProject.value.name,
      description: newProject.value.description || undefined
    })
    projects.value.unshift(created)
    showCreateModal.value = false
    newProject.value = { name: '', description: '' }
  } catch (error) {
    console.error('创建项目失败:', error)
  }
}

const goToDocuments = (projectId: number) => {
  router.push(`/projects/${projectId}/documents`)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 显示下拉菜单
const showMenu = (event: MouseEvent, project: Project) => {
  event.stopPropagation()
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  menuPosition.value = {
    x: rect.right - 120,
    y: rect.bottom + 8
  }
  showMenuFor.value = project.id
  currentProject.value = project
}

// 关闭菜单
const closeMenu = () => {
  showMenuFor.value = null
}

// 打开重命名模态框
const openRename = () => {
  if (!currentProject.value) return
  editProjectName.value = currentProject.value.name
  editProjectDesc.value = currentProject.value.description || ''
  showMenuFor.value = null
  showRenameModal.value = true
}

// 保存重命名
const handleRename = async () => {
  if (!currentProject.value || !editProjectName.value.trim()) return
  try {
    const updated = await mockApi.updateProject(currentProject.value.id, {
      name: editProjectName.value.trim(),
      description: editProjectDesc.value.trim() || null
    })
    
    // 更新本地列表中的数据
    const index = projects.value.findIndex(p => p.id === updated.id)
    if (index !== -1) {
      projects.value[index] = updated
    }
    
    showRenameModal.value = false
  } catch (error) {
    console.error('重命名失败:', error)
    alert(error instanceof Error ? error.message : '重命名失败')
  }
}

// 软删除（移入回收站）
const softDeleteProject = () => {
  if (!currentProject.value) return
  const index = projects.value.findIndex(p => p.id === currentProject.value!.id)
  if (index > -1) {
    const proj = projects.value.splice(index, 1)[0] as Project
    trashedProjects.value.push({ ...proj, deletedAt: new Date().toISOString() } as Project)
  }
  showMenuFor.value = null
}

// 执行彻底删除
const handleDelete = () => {
  if (!currentProject.value) return
  trashedProjects.value = trashedProjects.value.filter(p => p.id !== currentProject.value!.id)
  showDeleteConfirm.value = false
  currentProject.value = null
}

// 恢复项目
const restoreProject = (project: Project) => {
  const index = trashedProjects.value.findIndex(p => p.id === project.id)
  if (index > -1) {
    const restored = trashedProjects.value.splice(index, 1)[0] as Project
    projects.value.push({ ...restored, deletedAt: undefined } as Project)
  }
}

// 打开回收站
const openTrash = () => {
  showMenuFor.value = null
  showTrashModal.value = true
}

// 导出项目
const handleExport = async () => {
  if (!currentProject.value) return
  showMenuFor.value = null
  
  const exportData = {
    project: currentProject.value,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentProject.value.name}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 查看统计
const showStats = async () => {
  if (!currentProject.value) return
  showMenuFor.value = null
  
  // 使用来自后端的真实统计数据
  const dist = currentProject.value.entityDistribution || {}
  projectStats.value = {
    documentCount: currentProject.value.documentsCount || 0,
    annotationCount: currentProject.value.annotationsCount || 0,
    entityCounts: {
      person: dist.person || 0,
      location: dist.location || 0,
      time: dist.time || 0,
      concept: dist.concept || 0,
      other: dist.other || 0
    }
  }
  showStatsModal.value = true
}

// 点击空白处关闭菜单
const handleDocumentClick = () => {
  if (showMenuFor.value) {
    closeMenu()
  }
}

onMounted(() => {
  loadProjects()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="page">
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
            <router-link to="/projects" class="nav-link active">项目管理</router-link>
            <router-link to="/profile" class="nav-link">个人中心</router-link>
          </nav>
          <div class="header-actions">
            <button class="btn ghost" @click="mockApi.logout(); router.push('/')">退出登录</button>
          </div>
        </div>
      </div>
    </header>

    <main class="page-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header-card">
          <div class="header-info">
            <h1>项目管理</h1>
            <p>管理您的古籍研究项目</p>
          </div>
          <div class="header-actions">
            <div class="search-box">
              <span class="search-icon" v-html="searchIcon"></span>
              <input
                v-model="searchQuery"
                type="text"
                class="input"
                placeholder="搜索项目..."
              />
            </div>
            <button class="btn ghost" @click="openTrash" v-if="trashedProjects.length > 0">
              🗑️ 回收站 ({{ trashedProjects.length }})
            </button>
            <button class="btn primary" @click="showCreateModal = true">
              <span v-html="plusIcon"></span> 新建项目
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
        </div>

        <!-- 项目列表 -->
        <div v-else-if="filteredProjects.length > 0" class="projects-grid">
          <article
            v-for="project in filteredProjects"
            :key="project.id"
            class="project-card"
            @click="goToDocuments(project.id)"
          >
            <div class="card-header">
              <div class="folder-icon" v-html="folderIcon"></div>
              <button class="more-btn" @click="showMenu($event, project)" v-html="moreIcon"></button>
            </div>
            <h3>{{ project.name }}</h3>
            <p class="project-desc">{{ project.description || '暂无描述' }}</p>
            <div class="project-meta">
              <span>文档 {{ project.documentsCount || 0 }}</span>
              <span>更新 {{ formatDate(project.updatedAt) }}</span>
            </div>
          </article>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-state-icon" v-html="folderIcon"></div>
          <h4>没有找到项目</h4>
          <p>尝试调整搜索条件或创建新项目</p>
          <button class="btn primary" @click="showCreateModal = true">
            + 新建项目
          </button>
        </div>
      </div>
    </main>

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
      <button class="dropdown-item" @click="showStats">
        <span v-html="chartIcon"></span>
        查看统计
      </button>
      <button class="dropdown-item" @click="handleExport">
        <span v-html="exportIcon"></span>
        导出项目
      </button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item danger" @click="softDeleteProject">
        <span v-html="deleteIcon"></span>
        删除到回收站
      </button>
    </div>

    <!-- 重命名模态框 -->
    <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>重命名项目</h3>
          <button class="modal-close" @click="showRenameModal = false">×</button>
        </div>
        <form @submit.prevent="handleRename" class="modal-form">
          <div class="form-group">
            <label for="editProjectName">项目名称</label>
            <input
              id="editProjectName"
              v-model="editProjectName"
              type="text"
              class="input"
              placeholder="请输入项目名称"
            />
          </div>
          <div class="form-group">
            <label for="editProjectDesc">项目描述</label>
            <textarea
              id="editProjectDesc"
              v-model="editProjectDesc"
              class="input textarea"
              placeholder="请输入项目描述（可选）"
              rows="4"
            ></textarea>
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

    <!-- 统计模态框 -->
    <div v-if="showStatsModal" class="modal-overlay" @click.self="showStatsModal = false">
      <div class="modal modal-stats">
        <div class="modal-header">
          <h3>项目统计</h3>
          <button class="modal-close" @click="showStatsModal = false">×</button>
        </div>
        <div class="stats-content">
          <div class="stats-project-name">
            <span class="stats-folder-icon" v-html="folderIcon"></span>
            <span>{{ currentProject?.name }}</span>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon" v-html="docIcon"></div>
              <div class="stat-info">
                <span class="stat-number">{{ projectStats.documentCount }}</span>
                <span class="stat-label">文档</span>
              </div>
            </div>
            <div class="stat-card secondary">
              <div class="stat-icon" v-html="annotationIcon"></div>
              <div class="stat-info">
                <span class="stat-number">{{ projectStats.annotationCount }}</span>
                <span class="stat-label">标注</span>
              </div>
            </div>
          </div>

          <div class="stats-detail">
            <h4>实体分布</h4>
            <div class="chart-container">
              <div class="donut-chart">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" stroke-width="12"/>
                  <circle 
                    v-for="(segment, index) in chartSegments" 
                    :key="index"
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    :stroke="segment.color" 
                    stroke-width="12"
                    :stroke-dasharray="segment.dashArray"
                    :stroke-dashoffset="segment.dashOffset"
                    stroke-linecap="round"
                    class="chart-segment"
                  />
                </svg>
                <div class="donut-center">
                  <span class="donut-total">{{ projectStats.annotationCount }}</span>
                  <span class="donut-label">总计</span>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item" v-for="entity in entityLegend" :key="entity.type">
                  <span class="legend-dot" :style="{ background: entity.color }"></span>
                  <span class="legend-label">{{ entity.label }}</span>
                  <span class="legend-value">{{ entity.count }}</span>
                  <span class="legend-percent">{{ entity.percent }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="stats-trend">
            <div class="trend-item">
              <span class="trend-label">最近更新</span>
              <span class="trend-value">{{ currentProject?.updatedAt ? formatDate(currentProject.updatedAt) : '-' }}</span>
            </div>
            <div class="trend-item">
              <span class="trend-label">创建时间</span>
              <span class="trend-value">{{ currentProject?.createdAt ? formatDate(currentProject.createdAt) : '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal modal-confirm">
        <div class="modal-header">
          <h3>确认彻底删除</h3>
          <button class="modal-close" @click="showDeleteConfirm = false">×</button>
        </div>
        <div class="confirm-content">
          <p>确定要彻底删除项目「{{ currentProject?.name }}」吗？</p>
          <p class="confirm-hint">此操作不可恢复</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn ghost" @click="showDeleteConfirm = false">
            取消
          </button>
          <button type="button" class="btn danger" @click="handleDelete">
            确认删除
          </button>
        </div>
      </div>
    </div>

    <!-- 创建项目弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建项目</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <form @submit.prevent="handleCreateProject" class="modal-form">
          <div class="form-group">
            <label for="projectName">项目名称</label>
            <input
              id="projectName"
              v-model="newProject.name"
              type="text"
              class="input"
              placeholder="请输入项目名称"
            />
          </div>
          <div class="form-group">
            <label for="projectDesc">项目描述</label>
            <textarea
              id="projectDesc"
              v-model="newProject.description"
              class="input textarea"
              placeholder="请输入项目描述（可选）"
              rows="4"
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

    <!-- 回收站弹窗 -->
    <div v-if="showTrashModal" class="modal-overlay" @click.self="showTrashModal = false">
      <div class="modal modal-trash">
        <div class="modal-header">
          <h3>🗑️ 回收站</h3>
          <button class="modal-close" @click="showTrashModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="trashedProjects.length === 0" class="empty-trash">
            <p>回收站是空的</p>
          </div>
          <div v-else class="trash-list">
            <div v-for="proj in trashedProjects" :key="proj.id" class="trash-item">
              <div class="trash-info">
                <span class="trash-title">{{ proj.name }}</span>
                <span class="trash-date">删除于 {{ formatDate(proj.deletedAt || proj.updatedAt) }}</span>
              </div>
              <div class="trash-actions">
                <button class="btn ghost small" @click="restoreProject(proj)">
                  <span v-html="restoreIcon"></span>
                  恢复
                </button>
                <button class="btn danger small" @click="currentProject = proj; showDeleteConfirm = true; showTrashModal = false">
                  <span v-html="deleteIcon"></span>
                  彻底删除
                </button>
              </div>
            </div>
          </div>
        </div>
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
  gap: 24px;
}

.nav-link {
  color: var(--ink);
  font-size: 14px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  background: var(--paper);
  color: var(--ink-soft);
}

.header-actions {
  display: flex;
  gap: 8px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.header-info h1 {
  font-size: 36px;
  margin-bottom: 4px;
}

.header-info p {
  color: var(--ink-soft);
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
}

.search-box .input {
  width: 300px;
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

/* 项目网格 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.project-card {
  background: var(--white);
  border: 1px solid var(--edge);
  border-radius: var(--radius-xl);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.project-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.folder-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, var(--ink), var(--ink-soft));
  color: var(--accent);
  font-weight: 700;
  font-size: 18px;
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
}

.project-card h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.project-desc {
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--edge);
  font-size: 12px;
  color: var(--ink-soft);
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
  max-width: 480px;
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
  min-height: 100px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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
  background: var(--edge);
}

.dropdown-item.danger {
  color: #dc3545;
}

.dropdown-item.danger:hover {
  background: #fef0f0;
}

.dropdown-item span {
  display: flex;
  align-items: center;
  color: var(--ink-soft);
}

.dropdown-item.danger span {
  color: #dc3545;
}

.dropdown-divider {
  height: 1px;
  background: var(--edge);
  margin: 8px 0;
}

/* 统计模态框 */
.modal-stats {
  max-width: 520px;
}

.stats-content {
  padding: 8px 4px 0;
}

.stats-project-name {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink-soft) 100%);
  border-radius: var(--radius);
  margin-bottom: 24px;
  color: white;
}

.stats-folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
}

.stats-project-name span:last-child {
  font-size: 18px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: inherit;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4px;
}

.stats-detail {
  margin-bottom: 24px;
}

.stats-detail h4 {
  font-size: 14px;
  color: var(--ink-soft);
  margin-bottom: 20px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chart-container {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 24px;
  background: var(--edge);
  border-radius: 16px;
}

.donut-chart {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.donut-chart svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.chart-segment {
  transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.donut-total {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.donut-label {
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 4px;
}

.chart-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: grid;
  grid-template-columns: 12px 1fr auto auto;
  align-items: center;
  gap: 10px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  font-size: 14px;
  color: var(--ink);
}

.legend-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.legend-percent {
  font-size: 12px;
  color: var(--ink-soft);
  min-width: 36px;
  text-align: right;
}

.stats-trend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid var(--edge);
}

.trend-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trend-label {
  font-size: 12px;
  color: var(--ink-soft);
}

.trend-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

/* 删除确认 */
.modal-confirm {
  max-width: 400px;
}

.confirm-content {
  padding: 16px 4px;
}

.confirm-content p {
  margin: 0;
  color: var(--ink);
}

.confirm-hint {
  font-size: 14px;
  color: var(--ink-soft) !important;
  margin-top: 8px !important;
}

/* 危险按钮 */
.btn.danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn.danger:hover {
  background: #c82333;
  border-color: #c82333;
}

/* 回收站弹窗 */
.modal-trash {
  max-width: 600px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.modal-trash .modal {
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-trash .modal-header {
  flex-shrink: 0;
}

.modal-trash .modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.empty-trash {
  text-align: center;
  padding: 40px;
  color: var(--ink-soft);
}

.trash-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trash-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--paper);
  border-radius: var(--radius-md);
}

.trash-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trash-title {
  font-weight: 500;
}

.trash-date {
  font-size: 12px;
  color: var(--ink-soft);
}

.trash-actions {
  display: flex;
  gap: 8px;
}

.btn.small {
  padding: 6px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .search-box .input {
    width: 100%;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
