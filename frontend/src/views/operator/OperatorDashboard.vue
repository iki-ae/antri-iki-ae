<template>
  <ion-page>
    <AdminPageHeader />

    <ion-content>
      <div v-if="!queueStore.state?.session" class="no-session">
        <p>{{ $t('operator.noSession') }}</p>
      </div>

      <template v-else>
        <div class="operator-body">
          <!-- Current ticket -->
          <div class="ticket-card">
            <div class="ticket-label">
              <span v-if="myCounter">{{ $t('counter.label') }} {{ myCategory?.prefix }}-{{ myCounter.name }} &mdash; </span>{{ $t('operator.nowServing') }}
            </div>
            <div v-if="currentTicket" class="ticket-number">{{ currentTicket.display_number }}</div>
            <div v-else class="ticket-idle">——</div>
          </div>

          <!-- Actions -->
          <div class="action-grid">
            <button class="action-btn warning span-full" :disabled="!currentTicket || busy" @click="recall">
              <ion-icon :icon="refreshCircle" />
              <span>{{ $t('operator.recall') }}</span>
            </button>
            <button class="action-btn success" :disabled="!currentTicket || busy" @click="serve">
              <ion-icon :icon="checkmarkCircleOutline" />
              <span>{{ $t('operator.done') }}</span>
            </button>
            <button class="action-btn muted" :disabled="!currentTicket || busy" @click="skip">
              <ion-icon :icon="playSkipForwardOutline" />
              <span>{{ $t('operator.skip') }}</span>
            </button>
            <button class="action-btn primary" :disabled="!!currentTicket || busy" @click="callNext">
              <ion-icon :icon="playCircleOutline" />
              <span>{{ $t('operator.callNext') }}</span>
            </button>
          </div>

          <!-- Category counters preview -->
          <div v-if="myCategory" class="counters-preview">
            <div class="counters-preview-label" :style="{ background: myCategory.color }">
              {{ myCategory.prefix }} — {{ myCategory.name }}
              <span class="preview-waiting">{{ waitingCount ?? 0 }} {{ $t('operator.waiting') }}</span>
            </div>
            <div class="counters-list">
              <div
                v-for="counter in categoryCounters"
                :key="counter.id"
                class="counter-card"
                :class="{
                  'counter-card--active': !!counter.currentTicket,
                  'counter-card--mine':   counter.id === auth.counterId,
                }"
                :style="counter.currentTicket ? { borderTopColor: myCategory.color } : {}"
              >
                <div class="counter-card-name">{{ myCategory.prefix }}-{{ counter.name }}</div>
                <div class="counter-card-number" :style="counter.currentTicket ? { color: myCategory.color } : {}">
                  {{ counter.currentTicket?.display_number ?? '—' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Skipped list -->
          <div v-if="categorySkipped.length" class="skipped-section">
            <div class="skipped-header">{{ $t('operator.skipped.title') }}</div>
            <div class="skipped-list">
              <div v-for="ticket in categorySkipped" :key="ticket.id" class="skipped-row">
                <span class="skipped-number">{{ ticket.display_number }}</span>
                <button class="skipped-recall-btn" :disabled="!!currentTicket || busy" @click="callSkipped(ticket.id)">
                  {{ $t('operator.skipped.recall') }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { addIcons } from 'ionicons'
import { playCircleOutline, refreshCircle, playSkipForwardOutline, checkmarkCircleOutline } from 'ionicons/icons'
import { IonPage, IonContent, IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'
import { useQueueStore } from '@/stores/queue'
import { ticketsApi } from '@/api'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

addIcons({ playCircleOutline, refreshCircle, playSkipForwardOutline, checkmarkCircleOutline })

const auth       = useAuthStore()
const queueStore = useQueueStore()
const busy       = ref(false)

onIonViewWillEnter(() => queueStore.connect())
onUnmounted(() => queueStore.disconnect())

const myCounter = computed(() =>
  queueStore.state?.counters.find(c => c.id === auth.counterId) ?? null
)
const myCategory = computed(() => myCounter.value?.category ?? null)
const currentTicket = computed(() => myCounter.value?.currentTicket ?? null)
const waitingCount  = computed(() => {
  if (!myCategory.value) return null
  return queueStore.state?.waiting.find(w => w.category_id === myCategory.value!.id)?.count ?? 0
})
const categoryCounters = computed(() => {
  if (!myCategory.value) return []
  return queueStore.state?.counters.filter(c => c.category.id === myCategory.value!.id) ?? []
})
const categorySkipped = computed(() => {
  if (!myCategory.value) return []
  return queueStore.state?.skipped.filter(s => s.category_id === myCategory.value!.id) ?? []
})

async function callSkipped(ticket_id: number) {
  if (busy.value) return
  busy.value = true
  try { await ticketsApi.callSkipped(ticket_id) } finally { busy.value = false }
}

async function callNext() {
  if (!auth.counterId || busy.value) return
  busy.value = true
  try { await ticketsApi.call(auth.counterId) } finally { busy.value = false }
}
async function recall() {
  if (!currentTicket.value || busy.value) return
  busy.value = true
  try { await ticketsApi.recall(currentTicket.value.id) } finally { busy.value = false }
}
async function skip() {
  if (!currentTicket.value || busy.value) return
  busy.value = true
  try { await ticketsApi.skip(currentTicket.value.id) } finally { busy.value = false }
}
async function serve() {
  if (!currentTicket.value || busy.value) return
  busy.value = true
  try { await ticketsApi.serve(currentTicket.value.id) } finally { busy.value = false }
}
</script>

<style scoped>
.operator-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 16px 32px;
}

.ticket-card,
.action-grid,
.skipped-section,
.counters-preview {
  max-width: 480px;
}

.ticket-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-top: 4px solid var(--color-primary);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ticket-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.ticket-number {
  font-size: var(--font-size-6xl);
  font-weight: 900;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  color: var(--color-primary);
  line-height: 1;
  white-space: nowrap;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ticket-idle {
  font-size: var(--font-size-6xl);
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--color-border);
  line-height: 1;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.idle-msg,
.no-session {
  text-align: center;
  color: var(--color-text-muted);
  padding: 40px 16px;
  font-size: var(--font-size-base);
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.span-full {
  grid-column: 1 / -1;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  color: #fff;
  padding: 16px 12px;
}

.action-btn:not(.span-full) {
  min-height: 72px;
  font-size: var(--font-size-xs);
  gap: 4px;
}

.action-btn:not(.span-full) ion-icon {
  font-size: 20px;
}

.action-btn ion-icon {
  font-size: 28px;
}

.action-btn.span-full {
  flex-direction: column;
  gap: 8px;
  font-size: 24px;
  font-weight: 800;
}

.action-btn.span-full ion-icon {
  font-size: 48px;
}

.action-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
  pointer-events: none;
}

.action-btn:not(:disabled):active {
  transform: scale(0.97);
}

.action-btn.primary  { background: var(--color-primary); }
.action-btn.warning  { background: var(--color-accent); }
.action-btn.muted    { background: var(--color-text-muted); }
.action-btn.success  { background: var(--color-secondary); }

.action-btn.primary:not(:disabled):hover  { background: var(--color-primary-dark); }
.action-btn.warning:not(:disabled):hover  { background: var(--color-accent-dark); }
.action-btn.muted:not(:disabled):hover    { background: var(--color-border-dark); }
.action-btn.success:not(:disabled):hover  { background: var(--color-secondary-dark); }

/* ── Skipped list ──────────────────────────────────────────────────────────── */

.skipped-section {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
}

.skipped-header {
  padding: 8px 14px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
}

.skipped-list {
  display: flex;
  flex-direction: column;
}

.skipped-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
}

.skipped-row:last-child {
  border-bottom: none;
}

.skipped-number {
  font-size: var(--font-size-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.skipped-recall-btn {
  padding: 6px 16px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: background 0.15s;
}

.skipped-recall-btn:not(:disabled):hover {
  background: var(--color-accent-dark);
}

.skipped-recall-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── Category counters preview ─────────────────────────────────────────────── */

.counters-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.counters-preview-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
}

.preview-waiting {
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 8px;
  border-radius: var(--radius-full);
}

.counters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.counter-card {
  flex: 0 0 calc(25% - 6px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-border);
  border-radius: var(--radius-md);
  min-width: 72px;
}

.counter-card--active {
  border-top-width: 3px;
}

.counter-card--mine {
  background: var(--color-surface-alt);
}

.counter-card-name {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.counter-card-number {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--color-border-dark);
}
</style>
