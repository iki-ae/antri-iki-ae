import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      component: () => import('@/views/auth/LoginPage.vue'),
    },

    // ── Admin (role: admin) ─────────────────────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminShell.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        { path: '',          redirect: '/admin/dashboard' },
        { path: 'dashboard', component: () => import('@/views/admin/DashboardPage.vue') },
        { path: 'categories',component: () => import('@/views/admin/CategoriesPage.vue') },
        { path: 'counters',    component: () => import('@/views/admin/CountersPage.vue') },
        { path: 'users',     component: () => import('@/views/admin/UsersPage.vue') },
        { path: 'session',   component: () => import('@/views/admin/SessionPage.vue') },
        { path: 'config',    component: () => import('@/views/admin/ConfigPage.vue') },
        { path: 'backup',    component: () => import('@/views/admin/BackupPage.vue') },
      ],
    },

    // ── Operator (role: operator) ───────────────────────────────────────────
    {
      path: '/operator',
      component: () => import('@/views/operator/OperatorShell.vue'),
      meta: { requiresAuth: true, role: 'operator' },
      children: [
        { path: '',           redirect: '/operator/dashboard' },
        { path: 'dashboard',  component: () => import('@/views/operator/OperatorDashboard.vue') },
        { path: 'settings',   component: () => import('@/views/operator/OperatorSettings.vue') },
      ],
    },

    // ── Public routes (no auth) ─────────────────────────────────────────────
    {
      path: '/display',
      component: () => import('@/views/display/DisplayPage.vue'),
    },
    {
      path: '/kiosk',
      component: () => import('@/views/kiosk/KioskPage.vue'),
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  await auth.restoreReady

  if (!to.meta.requiresAuth) return next()

  if (!auth.isLoggedIn) return next('/login')

  if (to.meta.role && auth.role !== to.meta.role) {
    return next(auth.role === 'admin' ? '/admin' : '/operator')
  }

  next()
})

export default router
