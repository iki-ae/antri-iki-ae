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
                <div class="session-title-row">
                  <span class="session-title">{{ s.title }}</span>
                  <span :class="['session-badge', s.status]">{{ $t('session.' + s.status) }}</span>
                  <span class="session-mode">{{ s.mode === 'kiosk' ? $t('session.kiosk') : $t('session.bulk') }}</span>
                </div>
                <div class="session-meta">
                  <span class="session-stat">{{ $t('session.issued') }}: <strong>{{ s.issued }}</strong></span>
                  <span class="session-stat">{{ $t('session.served') }}: <strong>{{ s.served }}</strong></span>
                </div>
              </div>
              <div class="session-actions">
                <!-- Edit: planned only -->
                <button
                  v-if="s.status === 'planned'"
                  class="icon-btn edit-btn"
                  :title="$t('common.edit')"
                  @click="openEdit(s)"
                >
                  <ion-icon :icon="pencilOutline" />
                </button>
                <!-- Reset: open only -->
                <button
                  v-if="s.status === 'open'"
                  class="icon-btn reset-btn"
                  :title="$t('session.reset')"
                  :disabled="!!busy[s.id]"
                  @click="resetSession(s.category_id!)"
                >
                  <ion-icon :icon="refreshOutline" />
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
                <!-- Start / Resume: planned or closed -->
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
    <ion-modal :is-open="modalOpen" @did-dismiss="closeModal" class="session-modal">
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

          <!-- Date read-only (edit only) -->
          <ion-input
            v-if="editTarget"
            :value="editTarget.date"
            :label="$t('session.date')"
            label-placement="floating"
            fill="outline"
            readonly
          />

          <!-- Category selector (create only) -->
          <ion-select
            v-if="!editTarget"
            v-model="form.category_id"
            :label="$t('category.label')"
            label-placement="floating"
            fill="outline"
          >
            <ion-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.prefix }} — {{ cat.name }}
            </ion-select-option>
          </ion-select>

          <!-- Session title -->
          <ion-input
            v-model="form.title"
            :label="$t('session.title')"
            label-placement="floating"
            fill="outline"
            :placeholder="$t('session.titlePlaceholder')"
            :maxlength="80"
            class="ion-margin-top"
          />

          <!-- Mode cards -->
          <div class="modal-field">
            <label class="modal-label">{{ $t('session.mode') }}</label>
            <div class="mode-cards">

              <!-- BULK card -->
              <div
                class="mode-card"
                :class="{ 'mode-card--active': form.mode === 'bulk' }"
                @click="form.mode = 'bulk'"
              >
                <div class="mode-card-header">
                  <span class="mode-radio" :class="{ active: form.mode === 'bulk' }"></span>
                  <div class="mode-card-labels">
                    <span class="mode-card-name">{{ $t('session.bulk') }}</span>
                    <span class="mode-card-desc">{{ $t('session.bulkDesc') }}</span>
                  </div>
                </div>
                <div v-if="form.mode === 'bulk'" class="mode-card-extra" @click.stop>
                  <ion-input
                    v-model="form.bulk_count"
                    :label="$t('session.bulkCount')"
                    label-placement="floating"
                    fill="outline"
                    type="number"
                    :min="1"
                  />
                </div>
              </div>

              <!-- KIOSK card -->
              <div
                class="mode-card"
                :class="{ 'mode-card--active': form.mode === 'kiosk' }"
                @click="form.mode = 'kiosk'"
              >
                <div class="mode-card-header">
                  <span class="mode-radio" :class="{ active: form.mode === 'kiosk' }"></span>
                  <div class="mode-card-labels">
                    <span class="mode-card-name">{{ $t('session.kiosk') }}</span>
                    <span class="mode-card-desc">{{ $t('session.kioskDesc') }}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="modal-actions">
            <ion-button v-if="editTarget" expand="block" color="danger" class="modal-delete" :disabled="saving" @click="confirmDelete(editTarget.id)">
              {{ $t('session.deleteThis') }}
            </ion-button>
            <ion-button expand="block" class="modal-submit" :disabled="saving || !form.title.trim()" @click="saveModal">
              {{ editTarget ? $t('common.save') : $t('session.create') }}
            </ion-button>
          </div>

        </div>
      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  IonPage, IonContent, IonFab, IonFabButton, IonModal, IonHeader, IonToolbar,
  IonTitle, IonButtons, IonButton, IonInput, IonSelect, IonSelectOption, IonIcon,
  alertController, onIonViewWillEnter,
} from '@ionic/vue'
import { addIcons } from 'ionicons'
import {
  addOutline, pencilOutline, trashOutline,
  playCircleOutline, playSkipForwardOutline, stopCircleOutline, refreshOutline,
} from 'ionicons/icons'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { useI18n } from 'vue-i18n'
import { sessionsApi, categoriesApi } from '@/api'
import type { Category, SessionWithStats } from '@/types'

addIcons({ addOutline, pencilOutline, trashOutline, playCircleOutline, playSkipForwardOutline, stopCircleOutline, refreshOutline })

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

async function resetSession(category_id: number) {
  const alert = await alertController.create({
    header: t('session.confirmReset'),
    message: t('session.resetWarning'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('session.reset'), role: 'destructive', handler: async () => {
        await sessionsApi.reset(category_id); await load()
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
        await sessionsApi.remove(id); closeModal(); await load()
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
  title: string
  mode: 'kiosk' | 'bulk'
  bulk_count: number | string
}>({ category_id: null, title: '', mode: 'bulk', bulk_count: 50 })

function openCreate() {
  editTarget.value    = null
  form.category_id    = categories.value[0]?.id ?? null
  form.title          = ''
  form.mode           = 'bulk'
  form.bulk_count     = 50
  modalOpen.value     = true
}

function openEdit(s: SessionWithStats) {
  editTarget.value    = s
  form.category_id    = s.category_id
  form.title          = s.title
  form.mode           = s.mode
  form.bulk_count     = s.issued || 50
  modalOpen.value     = true
}

function closeModal() {
  modalOpen.value  = false
  editTarget.value = null
}

async function saveModal() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    const bulkCount = form.mode === 'bulk' ? Number(form.bulk_count) || 50 : undefined
    if (editTarget.value) {
      await sessionsApi.update(editTarget.value.id, {
        title: form.title.trim(),
        mode: form.mode,
        bulk_count: bulkCount,
      })
    } else {
      if (!form.category_id) return
      await sessionsApi.create({
        category_id: form.category_id,
        title: form.title.trim(),
        mode: form.mode,
        bulk_count: bulkCount,
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
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.session-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.session-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 3px;
}

.session-stat {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}
.session-stat strong { color: var(--color-text); }

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

.session-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  transition: filter 0.15s;
  flex-shrink: 0;
}
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.icon-btn:not(:disabled):hover { filter: brightness(0.88); }

.edit-btn  { background: #b8860b; }
.reset-btn { background: #555; }

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.modal-actions ion-button { flex: 1; }

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  font-family: var(--font-family);
  cursor: pointer;
  transition: filter 0.15s;
  white-space: nowrap;
  color: #fff;
  flex-shrink: 0;
}
.action-btn ion-icon { font-size: 14px; }
.action-btn:disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.action-btn:not(:disabled):hover { filter: brightness(0.88); }

.start-btn { background: var(--color-secondary); }
.stop-btn  { background: var(--ion-color-warning); }

.session-empty {
  padding: 16px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
}

/* ── Modal ── */
.session-modal {
  --width: min(420px, 96vw);
  --height: 600px;
  --border-radius: 12px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.modal-submit { margin-top: 8px; }

/* ── Mode cards ── */
.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-card {
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: var(--color-surface);
  user-select: none;
}
.mode-card:hover { border-color: var(--color-accent); }
.mode-card--active {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface));
}

.mode-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.mode-radio.active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  box-shadow: inset 0 0 0 3px var(--color-surface);
}

.mode-card-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-card-name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
}

.mode-card-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.mode-card-extra {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

</style>
