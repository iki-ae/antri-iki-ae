import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QueueState } from '@/types'

export type AnnouncedTicket = {
  counterId:     number
  displayNumber: string
  color:         string
  prefix:        string
  counterName:   string
  calledAt:      string
  isRecall:      boolean
}

type Listener = (ticket: AnnouncedTicket) => void

export const useQueueStore = defineStore('queue', () => {
  const state     = ref<QueueState | null>(null)
  const connected = ref(false)
  let   _es: EventSource | null = null

  // Per-message announce listeners — called synchronously inside onmessage,
  // before Vue batches the reactive update, so rapid-fire SSE messages are
  // each delivered individually.
  const _listeners = new Set<Listener>()
  function onAnnounce(fn: Listener) { _listeners.add(fn) }
  function offAnnounce(fn: Listener) { _listeners.delete(fn) }

  // One-shot listener fired with the first (seed) message — lets consumers
  // initialise display state from the page-load snapshot without triggering sound.
  type StateListener = (state: QueueState) => void
  const _firstStateListeners = new Set<StateListener>()
  function onFirstState(fn: StateListener) { _firstStateListeners.add(fn) }
  function offFirstState(fn: StateListener) { _firstStateListeners.delete(fn) }

  // Track last known calledAt per counter so we can detect new calls vs page-load state.
  // Seeded on the first message (page-load snapshot) — only changes after that trigger announces.
  const _lastCalledAt = new Map<number, string>()
  let _seeded = false

  function connect() {
    if (_es) return
    _es = new EventSource('/api/events')

    _es.onopen = () => { connected.value = true }

    _es.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type !== 'queue_update') return

      const incoming: QueueState = msg.data

      if (!_seeded) {
        // First message after connect — treat as page-load snapshot, no announces.
        _seeded = true
        for (const counter of incoming.counters ?? []) {
          if (counter.currentTicket) _lastCalledAt.set(counter.id, counter.currentTicket.called_at)
        }
        state.value = incoming
        _firstStateListeners.forEach(fn => fn(incoming))
        return
      }

      // Subsequent messages — detect newly called/recalled tickets
      if (_listeners.size > 0) {
        for (const counter of incoming.counters ?? []) {
          const t = counter.currentTicket
          if (!t) continue
          const prev = _lastCalledAt.get(counter.id)
          if (t.called_at !== prev) {
            _listeners.forEach(fn => fn({
              counterId:     counter.id,
              displayNumber: t.display_number,
              color:         counter.category.color,
              prefix:        counter.category.prefix,
              counterName:   counter.name,
              calledAt:      t.called_at,
              isRecall:      prev !== undefined && t.display_number === (
                state.value?.counters.find(c => c.id === counter.id)?.currentTicket?.display_number ?? ''
              ),
            }))
          }
        }
      }

      // Sync calledAt map
      for (const counter of incoming.counters ?? []) {
        if (counter.currentTicket) _lastCalledAt.set(counter.id, counter.currentTicket.called_at)
        else _lastCalledAt.delete(counter.id)
      }

      state.value = incoming
    }

    _es.onerror = () => {
      connected.value = false
      _es?.close()
      _es = null
      setTimeout(connect, 3000)
    }
  }

  function disconnect() {
    _es?.close()
    _es = null
    connected.value = false
    _lastCalledAt.clear()
    _seeded = false
  }

  return { state, connected, connect, disconnect, onAnnounce, offAnnounce, onFirstState, offFirstState }
})
