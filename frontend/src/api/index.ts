import axios from 'axios'
import type { Config, Category, Counter, User, Session, QueueState } from '@/types'

const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Lazy import to avoid circular dep at module load time
      import('@/stores/auth').then(({ useAuthStore }) => {
        const store = useAuthStore()
        // During bootstrap restore() handles the 401 itself — don't race with it.
        if (store.isRestoring()) return
        store.logout()
        import('@/router').then(({ default: router }) => {
          router.replace('/login')
        })
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
  get:    ()             => api.get<Config>('/config'),
  update: (data: Partial<Config>) => api.put<Config>('/config', data),
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
  current: ()            => api.get<Session | null>('/sessions/current'),
  open:    (data: { mode: 'bulk' | 'kiosk'; bulk?: { category_id: number; count: number }[] }) => api.post<Session>('/sessions/open', data),
  close:   ()            => api.post('/sessions/close'),
  reset:   ()            => api.post('/sessions/reset'),
}

export const ticketsApi = {
  call:        (counter_id: number) => api.post('/tickets/call', { counter_id }),
  recall:      (ticket_id: number)  => api.post('/tickets/recall', { ticket_id }),
  skip:        (ticket_id: number)  => api.post('/tickets/skip', { ticket_id }),
  serve:       (ticket_id: number)  => api.post('/tickets/serve', { ticket_id }),
  callSkipped: (ticket_id: number)  => api.post('/tickets/call-skipped', { ticket_id }),
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
