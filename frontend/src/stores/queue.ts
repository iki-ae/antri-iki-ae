import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QueueState } from '@/types'

export const useQueueStore = defineStore('queue', () => {
  const state   = ref<QueueState | null>(null)
  const connected = ref(false)
  let   _es: EventSource | null = null

  function connect() {
    if (_es) return
    _es = new EventSource('/api/events')

    _es.onopen = () => { connected.value = true }

    _es.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'queue_update') state.value = msg.data
    }

    _es.onerror = () => {
      connected.value = false
      _es?.close()
      _es = null
      // Auto-reconnect after 3s
      setTimeout(connect, 3000)
    }
  }

  function disconnect() {
    _es?.close()
    _es = null
    connected.value = false
  }

  return { state, connected, connect, disconnect }
})
