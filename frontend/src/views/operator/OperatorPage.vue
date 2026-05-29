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

    <ion-content class="ion-padding">
      <div v-if="!queueStore.state?.session" class="no-session">
        <p>{{ $t('operator.noSession') }}</p>
      </div>

      <template v-else>
        <!-- Current ticket -->
        <ion-card v-if="currentTicket">
          <ion-card-header>
            <ion-card-subtitle>{{ $t('operator.nowServing') }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content class="ticket-display">
            <TicketNumber :display-number="currentTicket.display_number" color="var(--ion-color-primary)" />
          </ion-card-content>
        </ion-card>
        <div v-else class="idle-msg">{{ $t('operator.idle') }}</div>

        <!-- Actions -->
        <div class="action-grid">
          <ion-button expand="block" size="large" :disabled="calling" @click="callNext">
            <ion-icon slot="start" name="play-circle-outline" />
            {{ $t('operator.callNext') }}
          </ion-button>
          <ion-button expand="block" size="large" color="warning" :disabled="!currentTicket" @click="recall">
            <ion-icon slot="start" name="refresh-circle-outline" />
            {{ $t('operator.recall') }}
          </ion-button>
          <ion-button expand="block" size="large" color="medium" :disabled="!currentTicket" @click="skip">
            <ion-icon slot="start" name="play-skip-forward-outline" />
            {{ $t('operator.skip') }}
          </ion-button>
          <ion-button expand="block" size="large" color="success" :disabled="!currentTicket" @click="serve">
            <ion-icon slot="start" name="checkmark-circle-outline" />
            {{ $t('operator.done') }}
          </ion-button>
        </div>

        <!-- Waiting count -->
        <div class="waiting-info" v-if="waitingCount !== null">
          {{ $t('operator.waiting') }}: <strong>{{ waitingCount }}</strong>
        </div>
      </template>
    </ion-content>

    <WatermarkFooter variant="subtle" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonButtons, IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQueueStore } from '@/stores/queue'
import { ticketsApi } from '@/api'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
import TicketNumber from '@/components/TicketNumber.vue'

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
.action-grid { display: grid; gap: 0.75rem; margin-top: 1rem; }
.ticket-display { display: flex; justify-content: center; padding: 1rem; }
.idle-msg, .no-session { text-align: center; opacity: 0.5; padding: 2rem; font-size: 1.1rem; }
.waiting-info { text-align: center; margin-top: 1rem; opacity: 0.7; }
</style>
