import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const role      = ref<'admin' | 'operator' | null>(null)
  const name      = ref<string>('')
  const counterId = ref<number | null>(null)

  const isLoggedIn = computed(() => role.value !== null)

  // Resolved once the initial /me check completes — guards must await this.
  let _restoreResolve!: () => void
  const restoreReady = new Promise<void>(res => { _restoreResolve = res })

  async function login(username: string, password: string) {
    const { data } = await authApi.login(username, password)
    role.value      = data.role
    name.value      = data.name
    counterId.value = data.counterId ?? null
    return data
  }

  async function logout() {
    await authApi.logout()
    role.value      = null
    name.value      = ''
    counterId.value = null
  }

  async function restore() {
    try {
      const { data } = await authApi.me()
      role.value      = data.role
      name.value      = data.name
      counterId.value = data.counterId ?? null
    } catch {
      role.value = null
    } finally {
      _restoreResolve()
    }
  }

  return { role, name, counterId, isLoggedIn, restoreReady, login, logout, restore }
})
