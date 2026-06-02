import axios from 'axios'
import type { Config, Category, Counter, User, Session, SessionWithStats, QueueState, CategorySession, PrintTicket } from '@/types'

const api = axios.create({ baseURL: '/api', withCredentials: true })

const PUBLIC_ROUTES = ['/display', '/kiosk', '/login']
// Never redirect on 401s from these endpoints — they are expected to 401 unauthenticated
const SKIP_REDIRECT_URLS = ['/auth/me', '/auth/logout']

api.interceptors.response.use(
  res => res,
  err => {
    const url: string = err.config?.url ?? ''
    if (err.response?.status === 401 && !SKIP_REDIRECT_URLS.some(u => url.includes(u))) {
      import('@/router').then(({ default: router }) => {
        const current = router.currentRoute.value.path
        if (PUBLIC_ROUTES.some(p => current.startsWith(p))) return
        import('@/stores/auth').then(({ useAuthStore }) => {
          useAuthStore().clear()
        })
        router.replace('/login')
      })
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login:  (username: string, password: string) => api.post('/auth/login', { username, password }),
  logout: ()                                    => api.post('/auth/logout'),
  me:     ()                                    => api.get('/auth/me'),
}

export const configApi = {
  get:          ()                       => api.get<Config>('/config'),
  update:       (data: Partial<Omit<Config, 'id' | 'updated_at'>>) => api.put<Config>('/config', data),
  termsAccept:  ()                       => api.post<Config>('/config/terms-accept', {}),
}

export const categoriesApi = {
  list:   ()             => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  remove: (id: number)   => api.delete(`/categories/${id}`),
}

export const countersApi = {
  list:   ()             => api.get<Counter[]>('/counters'),
  create: (data: Partial<Counter>) => api.post<Counter>('/counters', data),
  update: (id: number, data: Partial<Counter>) => api.put<Counter>(`/counters/${id}`, data),
  remove: (id: number)   => api.delete(`/counters/${id}`),
}

export const usersApi = {
  list:       ()             => api.get<User[]>('/users'),
  create:     (data: Partial<User> & { password: string }) => api.post<User>('/users', data),
  update:     (id: number, data: Partial<User> & { password?: string }) => api.put<User>(`/users/${id}`, data),
  remove:     (id: number)   => api.delete(`/users/${id}`),
  updateSelf: (data: { name?: string; password?: string }) => api.put('/users/me', data),
}

export const sessionsApi = {
  list:    ()                                                                           => api.get<SessionWithStats[]>('/sessions/list'),
  current: ()                                                                           => api.get<CategorySession[]>('/sessions/current'),
  create:  (data: { category_id: number; title: string; mode: 'bulk' | 'kiosk'; bulk_count?: number; kiosk_limit?: number }) => api.post<Session>('/sessions/create', data),
  update:  (id: number, data: { title?: string; mode?: 'bulk' | 'kiosk'; bulk_count?: number; kiosk_limit?: number })         => api.put<Session>(`/sessions/${id}`, data),
  start:   (session_id: number)                                                         => api.post<Session>('/sessions/start', { session_id }),
  stop:    (session_id: number)                                                         => api.post('/sessions/stop', { session_id }),
  remove:  (id: number)                                                                  => api.delete(`/sessions/${id}`),
  reset:   (category_id: number)                                                         => api.post('/sessions/reset', { category_id }),
}

export const ticketsApi = {
  call:        (counter_id: number) => api.post('/tickets/call', { counter_id }),
  recall:      (ticket_id: number)  => api.post('/tickets/recall', { ticket_id }),
  skip:        (ticket_id: number)  => api.post('/tickets/skip', { ticket_id }),
  serve:       (ticket_id: number)  => api.post('/tickets/serve', { ticket_id }),
  callSkipped: (ticket_id: number)  => api.post('/tickets/call-skipped', { ticket_id }),
  bySession:   (sessionId: number, from?: number, to?: number) =>
    api.get<PrintTicket[]>(`/tickets/by-session/${sessionId}`, { params: { from, to } }),
}

export const kioskApi = {
  status: ()             => api.get('/kiosk/status'),
  take:   (category_id: number) => api.post('/kiosk/take', { category_id }),
}

export const displayApi = {
  state: ()              => api.get<QueueState>('/display/state'),
}

export const backupApi = {
  exportUrl: '/api/backup/export',
  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/backup/import', form)
  },
}

export default api
