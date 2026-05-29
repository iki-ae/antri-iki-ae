<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('operator.title') }} — {{ auth.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="doLogout">{{ $t('auth.logout') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!queueStore.state?.session" class="no-session">
        <p>{{ $t('operator.noSession') }}</p>
      </div>

      <template v-else>
        <div class="operator-body">
          <!-- Current ticket -->
          <div class="ticket-card" v-if="currentTicket">
            <div class="ticket-label">{{ $t('operator.nowServing') }}</div>
            <TicketNumber :display-number="currentTicket.display_number" color="var(--color-primary)" />
          </div>
          <div v-else class="idle-msg">{{ $t('operator.idle') }}</div>

          <!-- Waiting count -->
          <div class="waiting-info" v-if="waitingCount !== null">
            {{ $t('operator.waiting') }}: <strong>{{ waitingCount }}</strong>
          </div>

          <!-- Actions -->
          <div class="action-grid">
            <button class="action-btn primary" :disabled="calling" @click="callNext">
              <ion-icon :icon="playCircleOutline" />
              <span>{{ $t('operator.callNext') }}</span>
            </button>
            <button class="action-btn warning" :disabled="!currentTicket" @click="recall">
              <ion-icon :icon="refreshCircleOutline" />
              <span>{{ $t('operator.recall') }}</span>
            </button>
            <button class="action-btn muted" :disabled="!currentTicket" @click="skip">
              <ion-icon :icon="playSkipForwardOutline" />
              <span>{{ $t('operator.skip') }}</span>
            </button>
            <button class="action-btn success" :disabled="!currentTicket" @click="serve">
              <ion-icon :icon="checkmarkCircleOutline" />
              <span>{{ $t('operator.done') }}</span>
            </button>
          </div>
        </div>
      </template>
    </ion-content>

    <WatermarkFooter variant="subtle" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { addIcons } from 'ionicons'
import { playCircleOutline, refreshCircleOutline, playSkipForwardOutline, checkmarkCircleOutline } from 'ionicons/icons'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQueueStore } from '@/stores/queue'
import { ticketsApi } from '@/api'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
import TicketNumber from '@/components/TicketNumber.vue'

addIcons({ playCircleOutline, refreshCircleOutline, playSkipForwardOutline, checkmarkCircleOutline })

const auth       = useAuthStore()
const queueStore = useQueueStore()
const router     = useRouter()
const calling    = ref(false)

onIonViewWillEnter(() => queueStore.connect())
onUnmounted(() => queueStore.disconnect())

const myCounter = computed(() =>
  queueStore.state?.counters.find(c => c.id === auth.counterId) ?? null
)
const currentTicket = computed(() => myCounter.value?.currentTicket ?? null)
const waitingCount  = computed(() => {
  const cat = myCounter.value?.category
  if (!cat) return null
  return queueStore.state?.waiting.find(w => w.category_id === cat.id)?.count ?? 0
})

async function callNext() {
  if (!auth.counterId) return
  calling.value = true
  try { await ticketsApi.call(auth.counterId) } finally { calling.value = false }
}
async function recall() { if (currentTicket.value) await ticketsApi.recall(currentTicket.value.id) }
async function skip()   { if (currentTicket.value) await ticketsApi.skip(currentTicket.value.id) }
async function serve()  { if (currentTicket.value) await ticketsApi.serve(currentTicket.value.id) }
async function doLogout() { await auth.logout(); router.replace('/login') }
</script>

<style scoped>
.operator-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 16px 32px;
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

.idle-msg,
.no-session {
  text-align: center;
  color: var(--color-text-muted);
  padding: 40px 16px;
  font-size: var(--font-size-base);
}

.waiting-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  padding: 4px 0;
}

.waiting-info strong {
  color: var(--color-text);
  font-weight: 700;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.action-btn ion-icon {
  font-size: 28px;
}

.action-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
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
</style>
