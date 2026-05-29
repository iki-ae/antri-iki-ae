<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>{{ $t('admin.nav.session') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <!-- No active session -->
      <div v-if="!session">
        <ion-segment v-model="mode">
          <ion-segment-button value="kiosk"><ion-label>{{ $t('session.kiosk') }}</ion-label></ion-segment-button>
          <ion-segment-button value="bulk"><ion-label>{{ $t('session.bulk') }}</ion-label></ion-segment-button>
        </ion-segment>

        <!-- Bulk: count per category -->
        <div v-if="mode === 'bulk'" class="ion-margin-top">
          <ion-item v-for="cat in categories" :key="cat.id">
            <ion-label>{{ cat.prefix }} — {{ cat.name }}</ion-label>
            <ion-input
              slot="end"
              type="number"
              min="0"
              style="max-width: 80px; text-align: right;"
              :value="bulkCounts[cat.id] ?? 0"
              @ion-input="bulkCounts[cat.id] = Number(($event.target as HTMLIonInputElement).value)"
            />
          </ion-item>
        </div>

        <ion-button expand="block" class="ion-margin-top" :disabled="opening" @click="openSession">
          {{ $t('session.open') }}
        </ion-button>
      </div>

      <!-- Active session -->
      <div v-else>
        <ion-card color="success">
          <ion-card-content>
            <strong>{{ $t('session.active') }}</strong> — {{ session.mode }} — {{ session.date }}
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" color="warning" class="ion-margin-top" @click="confirmClose">
          {{ $t('session.close') }}
        </ion-button>
        <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" @click="confirmReset">
          {{ $t('session.reset') }}
        </ion-button>
      </div>
    </ion-content>
    <WatermarkFooter variant="subtle" />
  </ion-page>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonButton, IonCard, IonCardContent, alertController, onIonViewWillEnter } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import { sessionsApi, categoriesApi } from '@/api'
import type { Session, Category } from '@/types'
import WatermarkFooter from '@/components/WatermarkFooter.vue'

const { t } = useI18n()

const session    = ref<Session | null>(null)
const categories = ref<Category[]>([])
const mode       = ref<'kiosk'|'bulk'>('kiosk')
const bulkCounts = reactive<Record<number, number>>({})
const opening    = ref(false)
onIonViewWillEnter(load)
async function load() {
  const [s, c] = await Promise.all([sessionsApi.current(), categoriesApi.list()])
  session.value = s.data; categories.value = c.data
}
async function openSession() {
  opening.value = true
  try {
    const bulk = mode.value === 'bulk'
      ? categories.value.map(c => ({ category_id: c.id, count: bulkCounts[c.id] ?? 0 })).filter(b => b.count > 0)
      : undefined
    await sessionsApi.open({ mode: mode.value, bulk })
    await load()
  } finally { opening.value = false }
}
async function confirmClose() {
  const alert = await alertController.create({
    header: t('session.confirmClose'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('session.close'), handler: async () => { await sessionsApi.close(); await load() } },
    ],
  })
  await alert.present()
}
async function confirmReset() {
  const alert = await alertController.create({
    header: t('session.confirmReset'),
    message: t('session.resetWarning'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('session.reset'), role: 'destructive', handler: async () => { await sessionsApi.reset(); await load() } },
    ],
  })
  await alert.present()
}
</script>
