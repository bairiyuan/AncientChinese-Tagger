import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { apiClient } from './api/http'
import router from './router'

const app = createApp(App)

apiClient.setTokenGetter(() => localStorage.getItem('auth_token'))

app.use(createPinia())
app.use(router)

app.mount('#app')
