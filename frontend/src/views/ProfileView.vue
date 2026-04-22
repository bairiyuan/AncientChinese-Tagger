<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi } from '@/api/mock'

const router = useRouter()

const user = ref({
  id: 0,
  username: '',
  createdAt: ''
})

onMounted(async () => {
  const currentUser = mockApi.getCurrentUser()
  if (currentUser) {
    user.value = currentUser
    // 尝试获取最新数据以确保包含注册时间
    try {
      const { getUser } = await import('@/api/users')
      const latestUser = await getUser(currentUser.id)
      if (latestUser) {
        user.value = {
          ...user.value,
          createdAt: latestUser.createdAt || latestUser.created_at || user.value.createdAt
        }
      }
    } catch (e) {
      console.error('Failed to fetch latest user info:', e)
    }
  }
})

const showUsernameForm = ref(false)
const newUsername = ref('')
const usernameError = ref('')
const usernameSuccess = ref('')
const isUpdatingUsername = ref(false)

const toggleUsernameForm = () => {
  showUsernameForm.value = !showUsernameForm.value
  newUsername.value = user.value.username
  usernameError.value = ''
  usernameSuccess.value = ''
}

const updateUsername = async () => {
  if (!newUsername.value.trim()) {
    usernameError.value = '用户名不能为空'
    return
  }
  if (newUsername.value.trim().length < 3) {
    usernameError.value = '用户名至少3个字符'
    return
  }

  isUpdatingUsername.value = true
  usernameError.value = ''

  try {
    await mockApi.updateUsername(newUsername.value.trim())
    user.value.username = newUsername.value.trim()
    usernameSuccess.value = '用户名修改成功'
    showUsernameForm.value = false
  } catch (e) {
    usernameError.value = e instanceof Error ? e.message : '修改失败'
  } finally {
    isUpdatingUsername.value = false
  }
}

const showPasswordForm = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')
const passwordSuccess = ref('')
const isUpdatingPassword = ref(false)

const togglePasswordForm = () => {
  showPasswordForm.value = !showPasswordForm.value
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
  passwordSuccess.value = ''
}

const updatePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!passwordForm.currentPassword) {
    passwordError.value = '请输入当前密码'
    return
  }
  if (!passwordForm.newPassword) {
    passwordError.value = '请输入新密码'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = '新密码至少6个字符'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }

  isUpdatingPassword.value = true

  try {
    await mockApi.updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
    passwordSuccess.value = '密码修改成功'
    showPasswordForm.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e) {
    passwordError.value = e instanceof Error ? e.message : '修改失败'
  } finally {
    isUpdatingPassword.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="page-bg"></div>

    <header class="profile-header">
      <div class="container">
        <div class="header-nav">
          <router-link to="/projects" class="back-link">返回</router-link>
          <h1>个人中心</h1>
          <div class="header-right"></div>
        </div>
      </div>
    </header>

    <main class="profile-main">
      <div class="container md">
        <div class="profile-card">
          <div class="user-avatar">
            {{ user.username ? user.username[0]?.toUpperCase() || 'U' : 'U' }}
          </div>
          <div class="user-info">
            <h2>{{ user.username }}</h2>
            <p v-if="user.createdAt || user.created_at">
              注册于 {{ new Date(user.createdAt || user.created_at || '').toLocaleDateString('zh-CN') }}
            </p>
          </div>
        </div>

        <div class="settings-card">
          <h3>账户设置</h3>

          <div class="setting-section">
            <div class="setting-header">
              <span>修改用户名</span>
              <button class="btn small" @click="toggleUsernameForm">
                {{ showUsernameForm ? '取消' : '修改' }}
              </button>
            </div>
            <div v-if="showUsernameForm" class="setting-form">
              <input
                v-model="newUsername"
                type="text"
                placeholder="新用户名"
                class="input"
                @keyup.enter="updateUsername"
              />
              <p v-if="usernameError" class="error">{{ usernameError }}</p>
              <p v-if="usernameSuccess" class="success">{{ usernameSuccess }}</p>
              <button
                class="btn primary"
                @click="updateUsername"
                :disabled="isUpdatingUsername"
              >
                {{ isUpdatingUsername ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>

          <div class="setting-section">
            <div class="setting-header">
              <span>修改密码</span>
              <button class="btn small" @click="togglePasswordForm">
                {{ showPasswordForm ? '取消' : '修改' }}
              </button>
            </div>
            <div v-if="showPasswordForm" class="setting-form">
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="当前密码"
                class="input"
              />
              <input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="新密码"
                class="input"
              />
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="确认新密码"
                class="input"
                @keyup.enter="updatePassword"
              />
              <p v-if="passwordError" class="error">{{ passwordError }}</p>
              <p v-if="passwordSuccess" class="success">{{ passwordSuccess }}</p>
              <button
                class="btn primary"
                @click="updatePassword"
                :disabled="isUpdatingPassword"
              >
                {{ isUpdatingPassword ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding-bottom: 60px;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #faf5f0 0%, #f5efe8 100%);
  z-index: -1;
}

.profile-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--edge);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.back-link {
  color: var(--ink-soft);
  font-size: 14px;
}

.header-nav h1 {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  width: 40px;
}

.profile-main {
  padding: 40px 0;
}

.profile-card {
  background: var(--white);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.user-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ink), var(--ink-soft));
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info h2 {
  font-size: 22px;
  margin-bottom: 6px;
}

.user-info p {
  color: var(--ink-soft);
  font-size: 14px;
}

.settings-card {
  background: var(--white);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.settings-card h3 {
  font-size: 16px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--edge);
}

.setting-section {
  padding: 16px 0;
}

.setting-section + .setting-section {
  border-top: 1px solid var(--edge);
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-header span {
  font-weight: 500;
}

.setting-form {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--edge);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--paper);
}

.input:focus {
  outline: none;
  border-color: var(--ink-soft);
}

.btn.small {
  padding: 6px 14px;
  font-size: 13px;
}

.error {
  color: var(--danger);
  font-size: 13px;
  margin: 0;
}

.success {
  color: var(--success);
  font-size: 13px;
  margin: 0;
}

@media (max-width: 480px) {
  .profile-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
