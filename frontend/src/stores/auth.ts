import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const id        = ref<number | null>(null)
  const role      = ref<'admin' | 'operator' | null>(null)
  const name      = ref<string>('')
  const counterId = ref<number | null>(null)

  const isLoggedIn = computed(() => role.value !== null)

  // Resolved once the initial /me check completes — guards must await this.
  let _restoreResolve!: () => void
  const restoreReady = new Promise<void>(res => { _restoreResolve = res })

  // True while restore() is in flight — interceptor must not redirect during bootstrap.
  let _restoring = false
  const isRestoring = () => _restoring

  async function login(username: string, password: string) {
    const { data } = await authApi.login(username, password)
    role.value      = data.role
    name.value      = data.name
    counterId.value = data.counterId ?? null
    return data
  }

  async function logout() {
    await authApi.logout()
    id.value        = null
    role.value      = null
    name.value      = ''
    counterId.value = null
  }

  async function restore() {
    _restoring = true
    try {
      const { data } = await authApi.me()
      id.value        = data.id ?? null
      role.value      = data.role
      name.value      = data.name
      counterId.value = data.counterId ?? null
    } catch {
      role.value = null
    } finally {
      _restoring = false
      _restoreResolve()
    }
  }

  return { id, role, name, counterId, isLoggedIn, isRestoring, restoreReady, login, logout, restore }
})
