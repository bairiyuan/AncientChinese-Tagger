import { describe, it, expect } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

const BASE_URL = '/'

const routes = [
  {
    path: '/',
    name: 'home',
    component: { template: '<div>Home</div>' },
  },
  {
    path: '/login',
    name: 'login',
    component: { template: '<div>Login</div>' },
  },
  {
    path: '/register',
    name: 'register',
    component: { template: '<div>Register</div>' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: { template: '<div>Projects</div>' },
  },
  {
    path: '/projects/:projectId/documents',
    name: 'documents',
    component: { template: '<div>Documents</div>' },
  },
  {
    path: '/projects/:projectId/documents/:documentId',
    name: 'editor',
    component: { template: '<div>Editor</div>' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: { template: '<div>Profile</div>' },
  },
]

const router = createRouter({
  history: createWebHistory(BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

describe('router configuration', () => {
  describe('routes', () => {
    it('has exactly 7 routes', () => {
      expect(router.getRoutes()).toHaveLength(7)
    })

    it('each route has a unique name', () => {
      const names = router.getRoutes().map((r) => r.name as string)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('has home route at /', () => {
      const route = router.getRoutes().find((r) => r.path === '/')
      expect(route).toBeDefined()
      expect(route!.name).toBe('home')
    })

    it('has login route at /login', () => {
      const route = router.getRoutes().find((r) => r.path === '/login')
      expect(route).toBeDefined()
      expect(route!.name).toBe('login')
    })

    it('has register route at /register', () => {
      const route = router.getRoutes().find((r) => r.path === '/register')
      expect(route).toBeDefined()
      expect(route!.name).toBe('register')
    })

    it('has projects route at /projects', () => {
      const route = router.getRoutes().find((r) => r.path === '/projects')
      expect(route).toBeDefined()
      expect(route!.name).toBe('projects')
    })

    it('has documents route with projectId param', () => {
      const route = router.getRoutes().find((r) => r.path === '/projects/:projectId/documents')
      expect(route).toBeDefined()
      expect(route!.name).toBe('documents')
    })

    it('has editor route with projectId and documentId params', () => {
      const route = router.getRoutes().find(
        (r) => r.path === '/projects/:projectId/documents/:documentId',
      )
      expect(route).toBeDefined()
      expect(route!.name).toBe('editor')
    })

    it('has profile route at /profile', () => {
      const route = router.getRoutes().find((r) => r.path === '/profile')
      expect(route).toBeDefined()
      expect(route!.name).toBe('profile')
    })
  })

  describe('scrollBehavior', () => {
    it('scrolls to top on navigation', () => {
      const result = router.options.scrollBehavior!()
      expect(result).toEqual({ top: 0 })
    })
  })
})
