<template>
  <div class="display-root">
    <div class="display-header">
      <h1>{{ configStore.institutionName }}</h1>
      <p class="display-subtitle">{{ $t('display.subtitle') }}</p>
    </div>

    <div v-if="queue.state?.session" class="counter-grid">
      <div
        v-for="counter in queue.state.counters"
        :key="counter.id"
        class="counter-card"
        :style="{ '--cat-color': counter.category.color }"
      >
        <div class="counter-name">{{ counter.name }}</div>
        <div class="counter-category">{{ counter.category.name }}</div>
        <div class="counter-number" :class="{ pulse: counter.currentTicket }">
          <TicketNumber :display-number="counter.currentTicket?.display_number ?? '—'" />
        </div>
      </div>
    </div>

    <div v-else class="display-idle">
      <p>{{ $t('display.noSession') }}</p>
    </div>

    <!-- Waiting summary per category -->
    <div v-if="queue.state?.waiting?.length" class="waiting-bar">
      <span
        v-for="w in queue.state.waiting"
        :key="w.category_id"
        class="waiting-badge"
      >
        {{ w.prefix }}: {{ $t('display.waiting', { count: w.count }) }}
      </span>
    </div>

    <WatermarkFooter variant="display" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useQueueStore }  from '@/stores/queue'
import { useConfigStore } from '@/stores/config'
import WatermarkFooter    from '@/components/WatermarkFooter.vue'
import TicketNumber       from '@/components/TicketNumber.vue'

const queue  = useQueueStore()
const configStore = useConfigStore()

onMounted(()  => queue.connect())
onUnmounted(() => queue.disconnect())
</script>

<style scoped>
.display-root {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #0f1923;
  color: #ffffff;
  overflow: hidden;
  padding: 24px;
  box-sizing: border-box;
}

.display-header {
  text-align: center;
  margin-bottom: 24px;
}
.display-header h1 {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 700;
  margin: 0 0 4px;
  letter-spacing: 0.02em;
}
.display-subtitle {
  font-size: clamp(14px, 2vw, 22px);
  opacity: 0.6;
  margin: 0;
}

.counter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  flex: 1;
  align-content: center;
}

.counter-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-top: 4px solid var(--cat-color, #378ADD);
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.counter-name {
  font-size: clamp(14px, 2vw, 20px);
  font-weight: 600;
  opacity: 0.9;
}
.counter-category {
  font-size: clamp(11px, 1.4vw, 15px);
  opacity: 0.5;
}
.counter-number {
  margin-top: 8px;
}
.counter-number.pulse {
  animation: pop 0.4s ease;
}
@keyframes pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.display-idle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  opacity: 0.4;
}

.waiting-bar {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 12px 0 8px;
}
.waiting-badge {
  background: rgba(255,255,255,0.1);
  border-radius: 100px;
  padding: 4px 14px;
  font-size: clamp(12px, 1.5vw, 16px);
  opacity: 0.75;
}
</style>
