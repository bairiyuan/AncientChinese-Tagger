<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi } from '@/api/mock'

const router = useRouter()

// SVG 图标
const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!form.username || !form.email || !form.password) {
    error.value = '请填写所有必填项'
    return
  }

  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (form.password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await mockApi.register(form.username, form.password)
    router.push('/projects')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '注册失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="page-bg"></div>

    <div class="auth-container">
      <div class="auth-decoration">
        <div class="decoration-content">
          <div class="brand-icon-large" v-html="brandIcon"></div>
          <h3>加入古文智注</h3>
          <p>开启您的古籍研究智能化之旅，与AI一起探索中华文化瑰宝</p>
          <div class="decoration-stats">
            <div class="stat-item">
              <span class="stat-number">1000+</span>
              <span class="stat-label">古籍文献</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">5000+</span>
              <span class="stat-label">标注实体</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">200+</span>
              <span class="stat-label">研究项目</span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-icon" v-html="brandIcon"></div>
          <div>
            <h1>古文智注</h1>
            <p>Ancient Text Intelligence</p>
          </div>
        </div>

        <h2 class="auth-title">注册账号</h2>
        <p class="auth-subtitle">创建账户，开始您的古籍研究之旅</p>

        <form @submit.prevent="handleRegister" class="auth-form">
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
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              placeholder="请输入邮箱"
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              placeholder="请输入密码（至少6位）"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              class="input"
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn primary full" :disabled="isLoading">
            {{ isLoading ? '注册中...' : '注册' }}
          </button>
        </form>

        <p class="switch-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </p>

        <router-link to="/" class="back-link">返回首页</router-link>
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

.brand-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: var(--accent);
  margin: 0 auto 24px;
}

.decoration-content h3 {
  font-size: 28px;
  margin-bottom: 12px;
}

.decoration-content p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  margin-bottom: 40px;
  line-height: 1.6;
}

.decoration-stats {
  display: flex;
  gap: 32px;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-serif);
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
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
