<template>
  <div class="queue-board">
    <div v-if="!state || !state.sessions?.length" class="no-session">
      <p>{{ $t('display.noSession') }}</p>
    </div>
    <template v-else>
      <div v-for="group in grouped" :key="group.category.id" class="category-section">
        <div class="category-header" :style="{ background: group.category.color }">
          <span class="category-name">{{ group.category.prefix }} — {{ group.category.name }}</span>
          <div class="header-badges">
            <span v-if="waitingMap[group.category.id]" class="waiting-badge">
              {{ $t('display.waiting', { count: waitingMap[group.category.id] }) }}
            </span>
            <span v-if="skippedMap[group.category.id]" class="skipped-badge">
              {{ skippedMap[group.category.id] }} {{ $t('ticket.skipped') }}
            </span>
          </div>
        </div>
        <div class="counters-row">
          <div
            v-for="counter in group.counters"
            :key="counter.id"
            class="counter-box"
            :style="{ '--cat-color': group.category.color }"
          >
            <div class="counter-title">{{ $t('counter.label') }} {{ group.category.prefix }}-{{ counter.name }}</div>
            <TicketNumber
              v-if="counter.currentTicket"
              :display-number="counter.currentTicket.display_number"
              :color="group.category.color"
              size="sm"
            />
            <div v-else class="counter-idle">—</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TicketNumber from './TicketNumber.vue'
import type { QueueState } from '@/types'

const props = defineProps<{ state: QueueState | null }>()

const grouped = computed(() => {
  if (!props.state) return []
  const map = new Map<number, { category: QueueState['counters'][0]['category']; counters: QueueState['counters'] }>()
  for (const counter of props.state.counters) {
    const cat = counter.category
    if (!map.has(cat.id)) map.set(cat.id, { category: cat, counters: [] })
    map.get(cat.id)!.counters.push(counter)
  }
  return [...map.values()]
})

const waitingMap = computed(() => {
  const out: Record<number, number> = {}
  for (const w of props.state?.waiting ?? []) out[w.category_id] = w.count
  return out
})

const skippedMap = computed(() => {
  const out: Record<number, number> = {}
  for (const s of props.state?.skipped ?? []) out[s.category_id] = (out[s.category_id] ?? 0) + 1
  return out
})
</script>

<style scoped>
.queue-board {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.no-session {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 1.25rem;
  color: var(--color-text-muted);
}

.category-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 12px;
}

.category-name {
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-badges {
  display: flex;
  gap: 6px;
  align-items: center;
}

.waiting-badge,
.skipped-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  color: #fff;
  white-space: nowrap;
}

.waiting-badge {
  background: rgba(0, 0, 0, 0.25);
}

.skipped-badge {
  background: rgba(0, 0, 0, 0.35);
  opacity: 0.85;
}

.counters-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 12px;
  background: var(--color-surface-alt);
}

.counter-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-top: 4px solid var(--cat-color);
  gap: 8px;
  min-width: 0;
}

.counter-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.counter-idle {
  font-size: 2rem;
  color: var(--color-border-dark);
  line-height: 1;
  padding: 8px 0;
}
</style>
