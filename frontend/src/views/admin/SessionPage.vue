<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.session') }}</h2>
        </div>

        <div v-for="cat in categories" :key="cat.id" class="category-card">
          <div class="category-header" :style="{ background: cat.color }">
            <span class="category-label">{{ cat.prefix }} — {{ cat.name }}</span>
            <span v-if="sessionOf(cat.id)" class="status-badge open">{{ $t('session.active') }}</span>
            <span v-else class="status-badge closed">{{ $t('session.closed') }}</span>
          </div>

          <!-- Open controls (no active session) -->
          <div v-if="!sessionOf(cat.id)" class="category-body">
            <ion-segment v-model="modeOf(cat.id).value" class="mode-segment">
              <ion-segment-button value="kiosk"><ion-label>{{ $t('session.kiosk') }}</ion-label></ion-segment-button>
              <ion-segment-button value="bulk"><ion-label>{{ $t('session.bulk') }}</ion-label></ion-segment-button>
            </ion-segment>

            <ion-item v-if="modeOf(cat.id).value === 'bulk'" lines="none" class="bulk-row">
              <ion-label>{{ $t('session.bulkCount') }}</ion-label>
              <ion-input
                slot="end"
                type="number"
                min="1"
                style="max-width: 80px; text-align: right;"
                :value="bulkCounts[cat.id] ?? 50"
                @ion-input="bulkCounts[cat.id] = Number(($event.target as HTMLIonInputElement).value)"
              />
            </ion-item>

            <ion-button expand="block" class="open-btn" :disabled="opening[cat.id]" @click="openSession(cat.id)">
              {{ $t('session.open') }}
            </ion-button>
          </div>

          <!-- Active session controls -->
          <div v-else class="category-body">
            <div class="session-info">
              {{ sessionOf(cat.id)!.mode === 'kiosk' ? $t('session.kiosk') : $t('session.bulk') }}
              &mdash; {{ sessionOf(cat.id)!.date }}
            </div>
            <div class="session-actions">
              <ion-button color="warning" expand="block" @click="confirmClose(cat.id)">
                {{ $t('session.close') }}
              </ion-button>
              <ion-button color="danger" fill="outline" expand="block" @click="confirmReset(cat.id)">
                {{ $t('session.reset') }}
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonButton, alertController, onIonViewWillEnter } from '@ionic/vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { useI18n } from 'vue-i18n'
import { sessionsApi, categoriesApi } from '@/api'
import type { Category, CategorySession } from '@/types'

const { t } = useI18n()

const categories    = ref<Category[]>([])
const openSessions  = ref<CategorySession[]>([])
const bulkCounts    = reactive<Record<number, number>>({})
const opening       = reactive<Record<number, boolean>>({})

// Per-category mode selection, defaulting to 'kiosk'
const modes = reactive<Record<number, 'kiosk' | 'bulk'>>({})
function modeOf(category_id: number): { value: 'kiosk' | 'bulk' } {
  if (!modes[category_id]) modes[category_id] = 'kiosk'
  // Return a proxy-like object so v-model on it works with ion-segment
  return {
    get value() { return modes[category_id] },
    set value(v: 'kiosk' | 'bulk') { modes[category_id] = v },
  }
}

function sessionOf(category_id: number): CategorySession | undefined {
  return openSessions.value.find(s => s.category_id === category_id)
}

onIonViewWillEnter(load)

async function load() {
  const [cats, sess] = await Promise.all([categoriesApi.list(), sessionsApi.current()])
  categories.value  = (cats.data as Category[]).filter(c => c.is_active)
  openSessions.value = sess.data as CategorySession[]
}

async function openSession(category_id: number) {
  opening[category_id] = true
  try {
    const mode = modes[category_id] ?? 'kiosk'
    const bulk_count = mode === 'bulk' ? (bulkCounts[category_id] ?? 50) : undefined
    await sessionsApi.open({ category_id, mode, bulk_count })
    await load()
  } finally {
    opening[category_id] = false
  }
}

async function confirmClose(category_id: number) {
  const alert = await alertController.create({
    header: t('session.confirmClose'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('session.close'), handler: async () => { await sessionsApi.close(category_id); await load() } },
    ],
  })
  await alert.present()
}

async function confirmReset(category_id: number) {
  const alert = await alertController.create({
    header: t('session.confirmReset'),
    message: t('session.resetWarning'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('session.reset'), role: 'destructive', handler: async () => { await sessionsApi.reset(category_id); await load() } },
    ],
  })
  await alert.present()
}
</script>

<style scoped>
.page-body {
  padding: 24px 16px 48px;
  min-height: 100%;
  background: var(--color-surface-alt);
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
}

.card-header {
  margin-bottom: 4px;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0;
}

.category-card {
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
  padding: 10px 16px;
  gap: 12px;
}

.category-label {
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge {
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.status-badge.open   { background: rgba(0,0,0,0.2); color: #fff; }
.status-badge.closed { background: rgba(0,0,0,0.15); color: rgba(255,255,255,0.75); }

.category-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-segment {
  margin-bottom: 4px;
}

.bulk-row {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.open-btn {
  margin-top: 4px;
}

.session-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

.session-actions {
  display: flex;
  gap: 10px;
}

.session-actions ion-button {
  flex: 1;
}
</style>
