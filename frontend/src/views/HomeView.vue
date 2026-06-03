<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { aiApi } from '@/api'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt()
const router = useRouter()

const renderAiMessageHtml = (text: string) => {
  return DOMPurify.sanitize(md.render(text))
}

// SVG 图标
const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`

const question = ref('')
const messages = ref<{ type: 'user' | 'ai'; text: string }[]>([
  {
    type: 'ai',
    text: '您好！我是古文智能助手，可以帮您分析古籍文献、解答相关问题。请问有什么可以帮助您的？'
  }
])
const isLoading = ref(false)

const features = [
  { 
    title: '项目管理', 
    desc: '统一管理多个古籍研究项目，支持团队协作与版本控制',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
  },
  { 
    title: '文本处理', 
    desc: '智能分词、断句、标点，自动识别古文结构与语法特征',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  },
  { 
    title: '实体标注', 
    desc: '精准标注人名、地名、时间、典故等实体，建立知识图谱',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`
  },
  { 
    title: 'AI问答', 
    desc: '基于文献内容的智能问答系统，快速检索相关信息',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
  },
  { 
    title: 'LLM分析', 
    desc: '大语言模型深度分析，提供文本解读、翻译与学术见解',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
  },
  { 
    title: '数据可视化', 
    desc: '多维度数据可视化展示，直观呈现研究成果与分析结果',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
  }
]

const workflow = [
  { step: '01', title: '上传文献', desc: '导入古籍文本或图片' },
  { step: '02', title: '智能处理', desc: '自动分词、断句、识别' },
  { step: '03', title: '实体标注', desc: '人工+AI协同标注' },
  { step: '04', title: 'AI分析', desc: 'LLM深度解读分析' },
  { step: '05', title: '导出成果', desc: '多格式导出研究数据' }
]

const quickQuestions = [
  '翻译成现代汉语',
  '标注文中人名地名',
  '解释重点词汇'
]

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const askQuestion = async (q?: string) => {
  const questionText = q || question.value.trim()
  if (!questionText) return

  messages.value.push({ type: 'user', text: questionText })
  question.value = ''
  isLoading.value = true

  try {
    const history = messages.value.slice(1, -1).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text
    }))

    const answer = await aiApi.aiChat({
      text: "用户正在首页进行古文咨询。请以古文研究助手的身份回答。",
      question: questionText,
      history
    })

    messages.value.push({ type: 'ai', text: answer })
  } catch (error) {
    console.error('Home AI Chat failed:', error)
    messages.value.push({ type: 'ai', text: '抱歉，古文智能助手暂时无法回答这个问题，请稍后再试。' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="home-page">
    <div class="page-bg"></div>

    <!-- 导航栏 -->
    <header class="home-nav">
      <div class="container">
        <div class="nav-inner">
          <div class="nav-brand">
            <div class="brand-icon" v-html="brandIcon"></div>
            <div class="brand-text">
              <strong>古文智注</strong>
              <p>Ancient Text Intelligence</p>
            </div>
          </div>
          <nav class="nav-links">
            <a href="#features">功能介绍</a>
            <a href="#workflow">工作流程</a>
            <a href="#assistant">AI助手</a>
          </nav>
          <div class="nav-actions">
            <button class="btn ghost" @click="goToLogin">登录</button>
            <button class="btn primary" @click="goToRegister">开始使用</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero区域 -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <span class="badge">AI驱动的古籍研究新范式</span>
          <h1>古文智能标注平台</h1>
          <p class="hero-text">
            融合人工智能与古典文献研究，提供项目管理、文本处理、实体标注、<br />
            智能问答和大语言模型分析的一体化学术平台
          </p>
          <div class="hero-actions">
            <button class="btn primary lg" @click="goToRegister">立即开始</button>
          </div>
        </div>
        <div class="hero-preview">
          <div class="preview-browser">
            <div class="browser-bar">
              <span></span><span></span><span></span>
              <em>古文智注平台 - 标注工作台</em>
            </div>
            <img
              src="https://images.unsplash.com/photo-1763225037262-75d0cb46f9c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwY2hpbmVzZSUyMGNhbGxpZ3JhcGh5JTIwbWFudXNjcmlwdHxlbnwxfHx8fDE3NzMxOTk3MTN8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="平台预览"
            />
            <div class="hero-mask">智能识别 · 精准标注 · 学术分析</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能介绍 -->
    <section id="features" class="section features">
      <div class="container">
        <div class="section-header">
          <h2>核心功能</h2>
          <p>为古籍研究提供全方位的智能化解决方案</p>
        </div>
        <div class="features-grid">
          <article v-for="feature in features" :key="feature.title" class="feature-item">
            <div class="feature-icon" v-html="feature.icon"></div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- 工作流程 -->
    <section id="workflow" class="section workflow">
      <div class="container">
        <div class="section-header">
          <h2>工作流程</h2>
          <p>五步完成从文献到知识的转化</p>
        </div>
        <div class="workflow-steps">
          <div v-for="(item, index) in workflow" :key="item.step" class="workflow-step">
            <div class="step-number">{{ item.step }}</div>
            <div class="step-content">
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </div>
            <div v-if="index < workflow.length - 1" class="step-arrow">→</div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI助手 -->
    <section id="assistant" class="section assistant">
      <div class="container">
        <div class="section-header">
          <h2>AI智能助手</h2>
          <p>基于大语言模型的智能问答系统</p>
        </div>
        <div class="assistant-wrapper">
          <div class="assistant-box">
            <div class="assistant-header">
              <span class="status-dot"></span>
              古文智能助手 · 在线
            </div>
            <div class="messages">
              <div
                v-for="(msg, index) in messages"
                :key="index"
                :class="['message', msg.type]"
              >
                <div v-if="msg.type === 'ai'" v-html="renderAiMessageHtml(msg.text)"></div>
                <template v-else>{{ msg.text }}</template>
              </div>
              <div v-if="isLoading" class="message ai loading">
                <span class="loading-dots">思考中</span>
              </div>
            </div>
            <div class="quick-questions">
              <span>快速提问</span>
              <button
                v-for="q in quickQuestions"
                :key="q"
                class="chip"
                @click="askQuestion(q)"
              >
                {{ q }}
              </button>
            </div>
            <div class="assistant-input">
              <input
                v-model="question"
                type="text"
                placeholder="输入您的问题..."
                @keyup.enter="askQuestion()"
              />
              <button class="btn primary" @click="askQuestion()" :disabled="isLoading">
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="home-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="brand-icon" v-html="brandIcon"></div>
            <div class="brand-info">
              <h3>古文智注</h3>
              <p>专注于古籍文献研究的智能化平台，为学术研究者提供先进的AI工具支持。</p>
            </div>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <h4>产品功能</h4>
              <a href="#features">项目管理</a>
              <a href="#features">文本处理</a>
              <a href="#assistant">AI问答</a>
            </div>
            <div class="footer-col">
              <h4>资源中心</h4>
              <a href="#">使用文档</a>
              <a href="#">视频教程</a>
              <a href="#">研究案例</a>
            </div>
            <div class="footer-col">
              <h4>账户入口</h4>
              <a href="/login">登录</a>
              <a href="/register">注册</a>
              <a href="#">帮助中心</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 古文智注平台 · Ancient Text Intelligence Platform</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* 导航栏 */
.home-nav {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--edge);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, var(--ink), var(--ink-soft));
  color: var(--accent);
}

.brand-text strong {
  display: block;
  font-family: var(--font-serif);
  font-size: 18px;
}

.brand-text p {
  color: var(--ink-soft);
  font-size: 12px;
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-links a {
  color: var(--ink);
  font-size: 14px;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--ink-soft);
}

.nav-actions {
  display: flex;
  gap: 8px;
}

/* Hero */
.hero {
  padding: 60px 0 80px;
  text-align: center;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto 40px;
}

.hero-content h1 {
  font-size: 48px;
  margin: 16px 0;
}

.hero-text {
  color: var(--ink-soft);
  line-height: 1.8;
  margin-bottom: 24px;
  font-size: 16px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.hero-preview {
  max-width: 1000px;
  margin: 0 auto;
}

.preview-browser {
  border: 1px solid var(--edge);
  border-radius: 12px;
  overflow: hidden;
  background: var(--white);
  box-shadow: var(--shadow-lg);
}

.browser-bar {
  padding: 10px 14px;
  background: linear-gradient(90deg, var(--ink), var(--ink-soft));
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.browser-bar span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.browser-bar em {
  font-style: normal;
  margin-left: 8px;
  font-size: 12px;
}

.preview-browser img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}

.hero-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  color: #fff;
  background: linear-gradient(180deg, transparent, rgba(45, 80, 22, 0.9));
}

.preview-browser {
  position: relative;
}

/* Sections */
.section {
  padding: 60px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 32px;
  margin-bottom: 8px;
}

.section-header p {
  color: var(--ink-soft);
}

/* Features */
.features {
  background: var(--white);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-item {
  padding: 24px;
  background: var(--paper);
  border: 1px solid var(--edge);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, var(--ink), var(--ink-soft));
  color: #fff;
  font-size: 20px;
  margin-bottom: 16px;
}

.feature-item h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.feature-item p {
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.6;
}

/* Workflow */
.workflow-steps {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  position: relative;
}

.workflow-step {
  flex: 1;
  text-align: center;
  position: relative;
  padding: 20px;
  background: var(--paper);
  border: 1px solid var(--edge);
  border-radius: 16px;
}

.step-number {
  display: inline-block;
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  padding: 4px 12px;
  margin-bottom: 12px;
  font-weight: 600;
}

.step-content h4 {
  margin-bottom: 4px;
  font-size: 16px;
}

.step-content p {
  color: var(--ink-soft);
  font-size: 13px;
}

.step-arrow {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--accent);
  font-size: 20px;
  z-index: 1;
}

/* Assistant */
.assistant {
  background: var(--white);
}

.assistant-wrapper {
  max-width: 700px;
  margin: 0 auto;
}

.assistant-box {
  border: 1px solid var(--edge);
  border-radius: 16px;
  background: var(--paper);
  overflow: hidden;
}

.assistant-header {
  padding: 14px 18px;
  background: linear-gradient(120deg, var(--ink), var(--ink-soft));
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.messages {
  padding: 16px;
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
}

.message {
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  line-height: 1.6;
  font-size: 14px;
}

.message.user {
  background: var(--ink);
  color: #fff;
  margin-left: 20%;
  width: 80%;
}

.message.ai {
  background: var(--white);
  border: 1px solid var(--edge);
  width: 85%;
}

.message.ai :deep(p) {
  margin-bottom: 8px;
}

.message.ai :deep(p:last-child) {
  margin-bottom: 0;
}

.message.ai :deep(strong) {
  font-weight: 700;
  color: var(--ink);
}

.message.ai :deep(ul), .message.ai :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message.loading {
  color: var(--ink-soft);
  font-style: italic;
}

.quick-questions {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-top: 1px solid var(--edge);
}

.quick-questions span {
  color: var(--ink-soft);
  font-size: 13px;
}

.assistant-input {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--edge);
  background: var(--white);
}

.assistant-input input {
  flex: 1;
  border: 1px solid var(--edge);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
}

.assistant-input input:focus {
  outline: none;
  border-color: var(--ink-soft);
}

/* Footer */
.home-footer {
  background: var(--ink);
  color: #fff;
  padding: 50px 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 40px;
  margin-bottom: 30px;
}

.footer-brand {
  display: flex;
  gap: 16px;
}

.footer-brand .brand-icon {
  background: rgba(255, 255, 255, 0.2);
  color: var(--accent);
}

.footer-brand h3 {
  margin-bottom: 8px;
  font-size: 20px;
}

.footer-brand p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.footer-col h4 {
  color: var(--accent);
  margin-bottom: 12px;
  font-size: 14px;
}

.footer-col a {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  margin-bottom: 8px;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #fff;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-bottom p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .workflow-steps {
    flex-wrap: wrap;
  }

  .workflow-step {
    flex: 1 1 calc(33.333% - 16px);
  }

  .step-arrow {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 32px;
  }

  .hero-text br {
    display: none;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .workflow-step {
    flex: 1 1 100%;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }

  .nav-links {
    display: none;
  }
}
</style>
