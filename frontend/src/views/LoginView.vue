<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi } from '@/api/mock'

const router = useRouter()

// SVG 图标
const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`

const form = reactive({
  username: '',
  password: ''
})

const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!form.username || !form.password) {
    error.value = '请填写用户名和密码'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await mockApi.login(form.username, form.password)
    router.push('/projects')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="page-bg"></div>

    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-icon" v-html="brandIcon"></div>
          <div>
            <h1>古文智注</h1>
            <p>Ancient Text Intelligence</p>
          </div>
        </div>

        <h2 class="auth-title">登录</h2>
        <p class="auth-subtitle">欢迎回来，继续您的古籍研究之旅</p>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="input"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn primary full" :disabled="isLoading">
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <p class="switch-link">
          没有账号？<router-link to="/register">立即注册</router-link>
        </p>

        <router-link to="/" class="back-link">返回首页</router-link>
      </div>

      <div class="auth-decoration">
        <div class="decoration-content">
          <h3>古籍研究新范式</h3>
          <p>融合人工智能与古典文献研究，让古籍焕发新生</p>
          <div class="decoration-features">
            <div class="df-item">
              <span class="df-icon">文</span>
              <span>智能标注</span>
            </div>
            <div class="df-item">
              <span class="df-icon">问</span>
              <span>AI问答</span>
            </div>
            <div class="df-item">
              <span class="df-icon">析</span>
              <span>深度分析</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--white);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  max-width: 900px;
  width: 100%;
}

.auth-card {
  padding: 48px 40px;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, var(--ink), var(--ink-soft));
  color: var(--accent);
  font-weight: 700;
  font-size: 20px;
}

.auth-brand h1 {
  font-size: 20px;
  margin-bottom: 2px;
}

.auth-brand p {
  color: var(--ink-soft);
  font-size: 12px;
}

.auth-title {
  font-size: 28px;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: var(--ink-soft);
  font-size: 14px;
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: var(--ink-soft);
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: #dc2626;
  font-size: 14px;
}

.switch-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--ink-soft);
}

.switch-link a {
  color: var(--ink);
  font-weight: 500;
}

.switch-link a:hover {
  text-decoration: underline;
}

.back-link {
  display: block;
  text-align: center;
  margin-top: 16px;
  color: var(--ink-soft);
  font-size: 13px;
}

.back-link:hover {
  color: var(--ink);
}

.auth-decoration {
  background: linear-gradient(135deg, var(--ink), var(--ink-soft));
  padding: 48px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.decoration-content {
  text-align: center;
}

.decoration-content h3 {
  font-size: 28px;
  margin-bottom: 12px;
}

.decoration-content p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.decoration-features {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.df-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.df-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.df-item span:last-child {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* 响应式 */
@media (max-width: 768px) {
  .auth-container {
    grid-template-columns: 1fr;
  }

  .auth-decoration {
    display: none;
  }

  .auth-card {
    padding: 32px 24px;
  }
}
</style>
