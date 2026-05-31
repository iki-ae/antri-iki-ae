<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">

        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.session') }}</h2>
          <button class="card-add-btn desktop-only" @click="openCreate()">
            <ion-icon :icon="addOutline" />
          </button>
        </div>

        <!-- Per-category session lists -->
        <div v-for="cat in categories" :key="cat.id" class="category-card">
          <div class="category-header" :style="{ background: cat.color }">
            <span class="category-label">{{ cat.prefix }} — {{ cat.name }}</span>
          </div>

          <div v-if="sessionsOf(cat.id).length" class="session-list">
            <div
              v-for="s in sessionsOf(cat.id)"
              :key="s.id"
              class="session-row"
              :class="'session-row--' + s.status"
            >
              <div class="session-row-left">
                <span class="session-date">{{ s.date }}</span>
                <span :class="['session-badge', s.status]">{{ $t('session.' + s.status) }}</span>
                <span class="session-mode">{{ s.mode === 'kiosk' ? $t('session.kiosk') : $t('session.bulk') }}</span>
              </div>
              <div class="session-stats">
                <span>{{ $t('session.issued') }}: <strong>{{ s.issued }}</strong></span>
                <span>{{ $t('session.served') }}: <strong>{{ s.served }}</strong></span>
              </div>
              <div class="session-actions">
                <!-- Edit: only planned -->
                <button
                  v-if="s.status === 'planned'"
                  class="icon-btn"
                  :title="$t('common.edit')"
                  @click="openEdit(s)"
                >
                  <ion-icon :icon="pencilOutline" />
                </button>
                <!-- Delete: planned or closed -->
                <button
                  v-if="s.status !== 'open'"
                  class="icon-btn danger"
                  :title="$t('common.delete')"
                  @click="confirmDelete(s.id)"
                >
                  <ion-icon :icon="trashOutline" />
                </button>
                <!-- Stop: open only -->
                <button
                  v-if="s.status === 'open'"
                  class="action-btn stop-btn"
                  :disabled="!!busy[s.id]"
                  @click="stopSession(s.id)"
                >
                  <ion-icon :icon="stopCircleOutline" />
                  {{ $t('session.stop') }}
                </button>
                <!-- Start: planned or closed -->
                <button
                  v-if="s.status !== 'open'"
                  class="action-btn start-btn"
                  :disabled="!!busy[s.id] || hasOpenSession(cat.id)"
                  @click="startSession(s.id)"
                >
                  <ion-icon :icon="s.status === 'closed' ? playSkipForwardOutline : playCircleOutline" />
                  {{ s.status === 'closed' ? $t('session.resume') : $t('session.start') }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="session-empty">{{ $t('session.none') }}</div>
        </div>

      </div>

      <!-- Mobile FAB -->
      <ion-fab class="mobile-fab" slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openCreate()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

    </ion-content>

    <!-- Create / Edit modal -->
    <ion-modal :is-open="modalOpen" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ editTarget ? $t('session.edit') : $t('session.create') }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">{{ $t('common.cancel') }}</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="modal-body">

          <!-- Category selector (create only) -->
          <div v-if="!editTarget" class="modal-field">
            <label class="modal-label">{{ $t('category.label') }}</label>
            <select v-model="form.category_id" class="modal-select">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.prefix }} — {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Mode -->
          <div class="modal-field">
            <label class="modal-label">{{ $t('session.mode') }}</label>
            <ion-segment v-model="form.mode">
              <ion-segment-button value="kiosk"><ion-label>{{ $t('session.kiosk') }}</ion-label></ion-segment-button>
              <ion-segment-button value="bulk"><ion-label>{{ $t('session.bulk') }}</ion-label></ion-segment-button>
            </ion-segment>
          </div>

          <!-- Bulk count -->
          <div v-if="form.mode === 'bulk'" class="modal-field">
            <label class="modal-label">{{ $t('session.bulkCount') }}</label>
            <input
              v-model.number="form.bulk_count"
              type="number"
              min="1"
              class="modal-input"
              placeholder=" "
            />
          </div>

          <ion-button expand="block" class="modal-submit" :disabled="saving" @click="saveModal">
            {{ editTarget ? $t('common.save') : $t('session.create') }}
          </ion-button>

        </div>
      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  IonPage, IonContent, IonFab, IonFabButton, IonModal, IonHeader, IonToolbar,
  IonTitle, IonButtons, IonButton, IonLabel, IonSegment, IonSegmentButton, IonIcon,
  alertController, onIonViewWillEnter,
} from '@ionic/vue'
import { addIcons } from 'ionicons'
import {
  addOutline, pencilOutline, trashOutline,
  playCircleOutline, playSkipForwardOutline, stopCircleOutline,
} from 'ionicons/icons'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { useI18n } from 'vue-i18n'
import { sessionsApi, categoriesApi } from '@/api'
import type { Category, SessionWithStats } from '@/types'

addIcons({ addOutline, pencilOutline, trashOutline, playCircleOutline, playSkipForwardOutline, stopCircleOutline })

const { t } = useI18n()

const categories = ref<Category[]>([])
const sessions   = ref<SessionWithStats[]>([])
const busy       = reactive<Record<number, boolean>>({})

onIonViewWillEnter(load)

async function load() {
  const [cats, sess] = await Promise.all([categoriesApi.list(), sessionsApi.list()])
  categories.value = (cats.data as Category[]).filter(c => c.is_active)
  sessions.value   = sess.data as SessionWithStats[]
}

function sessionsOf(category_id: number): SessionWithStats[] {
  return sessions.value
    .filter(s => s.category_id === category_id)
    .sort((a, b) => b.id - a.id)
}

function hasOpenSession(category_id: number): boolean {
  return sessions.value.some(s => s.category_id === category_id && s.status === 'open')
}

// ── Actions ────────────────────────────────────────────────────────────────────

async function startSession(session_id: number) {
  if (busy[session_id]) return
  busy[session_id] = true
  try { await sessionsApi.start(session_id); await load() } finally { delete busy[session_id] }
}

async function stopSession(session_id: number) {
  if (busy[session_id]) return
  const alert = await alertController.create({
    header: t('session.confirmStop'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('session.stop'), handler: async () => {
        busy[session_id] = true
        try { await sessionsApi.stop(session_id); await load() } finally { delete busy[session_id] }
      }},
    ],
  })
  await alert.present()
}

async function confirmDelete(id: number) {
  const alert = await alertController.create({
    header: t('session.confirmDelete'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('common.delete'), role: 'destructive', handler: async () => {
        await sessionsApi.remove(id); await load()
      }},
    ],
  })
  await alert.present()
}

// ── Modal ──────────────────────────────────────────────────────────────────────

const modalOpen  = ref(false)
const saving     = ref(false)
const editTarget = ref<SessionWithStats | null>(null)

const form = reactive<{
  category_id: number | null
  mode: 'kiosk' | 'bulk'
  bulk_count: number
}>({ category_id: null, mode: 'kiosk', bulk_count: 50 })

function openCreate() {
  editTarget.value    = null
  form.category_id    = categories.value[0]?.id ?? null
  form.mode           = 'kiosk'
  form.bulk_count     = 50
  modalOpen.value     = true
}

function openEdit(s: SessionWithStats) {
  editTarget.value    = s
  form.category_id    = s.category_id
  form.mode           = s.mode
  form.bulk_count     = s.issued || 50
  modalOpen.value     = true
}

function closeModal() {
  modalOpen.value  = false
  editTarget.value = null
}

async function saveModal() {
  saving.value = true
  try {
    if (editTarget.value) {
      await sessionsApi.update(editTarget.value.id, {
        mode: form.mode,
        bulk_count: form.mode === 'bulk' ? form.bulk_count : undefined,
      })
    } else {
      if (!form.category_id) return
      await sessionsApi.create({
        category_id: form.category_id,
        mode: form.mode,
        bulk_count: form.mode === 'bulk' ? form.bulk_count : undefined,
      })
    }
    closeModal()
    await load()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-body {
  padding: 24px 16px 80px;
  min-height: 100%;
  background: var(--color-surface-alt);
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
}

.category-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.category-header {
  padding: 10px 16px;
}

.category-label {
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Session rows ── */
.session-list {
  display: flex;
  flex-direction: column;
}

.session-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}
.session-row:last-child { border-bottom: none; }

.session-row--open { background: color-mix(in srgb, var(--color-secondary) 6%, transparent); }

.session-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.session-date {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.session-badge {
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 1px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.session-badge.planned { background: var(--color-surface-alt); color: var(--color-text-muted); border: 1px solid var(--color-border); }
.session-badge.open    { background: color-mix(in srgb, var(--color-secondary) 15%, white); color: var(--color-secondary-dark); border: 1px solid var(--color-secondary); }
.session-badge.closed  { background: var(--color-surface-alt); color: var(--color-text-muted); border: 1px solid var(--color-border-dark); }

.session-mode {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.session-stats {
  display: flex;
  gap: 12px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.session-stats strong { color: var(--color-text); }

.session-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 16px;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: var(--color-surface-alt); color: var(--color-text); }
.icon-btn.danger:hover { background: #fef2f2; color: var(--ion-color-danger); border-color: var(--ion-color-danger); }

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  font-family: var(--font-family);
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
  color: #fff;
}
.action-btn:disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.action-btn ion-icon { font-size: 14px; }

.start-btn { background: var(--color-secondary); }
.start-btn:not(:disabled):hover { background: var(--color-secondary-dark); }
.stop-btn  { background: var(--ion-color-warning); }
.stop-btn:not(:disabled):hover  { background: var(--ion-color-warning-shade); }

.session-empty {
  padding: 16px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
}

/* ── Modal ── */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 480px;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.modal-select,
.modal-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
}
.modal-select:focus,
.modal-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(224,140,47,0.12);
}

.modal-submit { margin-top: 8px; }
</style>
