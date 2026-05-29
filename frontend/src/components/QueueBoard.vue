<template>
  <div class="queue-board">
    <div v-if="!state || !state.session" class="no-session">
      <p>{{ $t('display.noSession') }}</p>
    </div>
    <template v-else>
      <div class="counters-grid">
        <div
          v-for="counter in state.counters"
          :key="counter.id"
          class="counter-card"
          :style="{ borderColor: counter.category.color }"
        >
          <div class="counter-name">{{ counter.name }}</div>
          <TicketNumber
            v-if="counter.currentTicket"
            :display-number="counter.currentTicket.display_number"
            :color="counter.category.color"
          />
          <div v-else class="counter-idle">—</div>
          <div class="category-badge" :style="{ background: counter.category.color }">
            {{ counter.category.name }}
          </div>
        </div>
      </div>
      <div class="waiting-summary">
        <span v-for="w in state.waiting" :key="w.category_id" class="waiting-item">
          {{ w.prefix }}: {{ w.count }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import TicketNumber from './TicketNumber.vue'
import type { QueueState } from '@/types'
defineProps<{ state: QueueState | null }>()
</script>

<style scoped>
.queue-board { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 1rem; }
.counters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; flex: 1; }
.counter-card { border: 3px solid; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); }
.counter-name { font-size: 1.1rem; font-weight: 600; }
.counter-idle { font-size: 3rem; color: #888; }
.category-badge { color: white; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; }
.waiting-summary { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; font-size: 1rem; opacity: 0.7; }
.waiting-item { background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 99px; }
.no-session { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; opacity: 0.5; }
</style>
