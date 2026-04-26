import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

const BASE_URL = '/'

const routes = [
  { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
  { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
  { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
  { path: '/projects', name: 'projects', component: { template: '<div>Projects</div>' } },
  { path: '/projects/:projectId/documents', name: 'documents', component: { template: '<div>Documents</div>' } },
  { path: '/projects/:projectId/documents/:documentId', name: 'editor', component: { template: '<div>Editor</div>' } },
  { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
]

function createTestRouter() {
  return createRouter({
    history: createWebHistory(BASE_URL),
    routes,
    scrollBehavior() {
      return { top: 0 }
    },
  })
}

describe('router navigation', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(() => {
    router = createTestRouter()
  })

  afterEach(() => {
    router.push('/')
  })

  it('navigates to home route', async () => {
    router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('navigates to login route', async () => {
    router.push('/login')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('navigates to register route', async () => {
    router.push('/register')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/register')
    expect(router.currentRoute.value.name).toBe('register')
  })

  it('navigates to projects route', async () => {
    router.push('/projects')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/projects')
    expect(router.currentRoute.value.name).toBe('projects')
  })

  it('navigates to documents route with projectId param', async () => {
    router.push('/projects/5/documents')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/projects/5/documents')
    expect(router.currentRoute.value.name).toBe('documents')
    expect(router.currentRoute.value.params.projectId).toBe('5')
  })

  it('navigates to editor route with projectId and documentId params', async () => {
    router.push('/projects/3/documents/7')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/projects/3/documents/7')
    expect(router.currentRoute.value.name).toBe('editor')
    expect(router.currentRoute.value.params.projectId).toBe('3')
    expect(router.currentRoute.value.params.documentId).toBe('7')
  })

  it('navigates to profile route', async () => {
    router.push('/profile')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/profile')
    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('resolves route by name', () => {
    const resolved = router.resolve({ name: 'editor', params: { projectId: '2', documentId: '9' } })
    expect(resolved.href).toBe('/projects/2/documents/9')
  })

  it('generates correct href for projects route', () => {
    const resolved = router.resolve({ name: 'projects' })
    expect(resolved.href).toBe('/projects')
  })
})
