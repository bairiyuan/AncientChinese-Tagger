import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

async function enableMockIfNeeded(): Promise<void> {
	if (import.meta.env.VITE_USE_MOCK !== 'true') {
		return
	}

	const { installMockServer } = await import('./mocks/mockServer')
	installMockServer()
}

await enableMockIfNeeded()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
