<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.users') }}</h2>
          <button class="card-add-btn desktop-only" @click="openForm()">
            <ion-icon :icon="addOutline" />
          </button>
        </div>

      <template v-for="group in groupedUsers" :key="group.key">
        <ion-list-header :style="{ '--background': group.headerColor, color: '#fff', borderRadius: '6px', marginBottom: '4px' }">
          <ion-label>{{ group.label }}</ion-label>
        </ion-list-header>
        <ion-list class="ion-margin-bottom">
          <ion-item v-for="u in group.users" :key="u.id">
            <ion-label>
              <h2>{{ u.name }}</h2>
              <p>{{ u.username }}<template v-if="u.counter_id"> · {{ counterLabel(u.counter_id) }}</template></p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="openForm(u)">
              <ion-icon :icon="pencilOutline" />
            </ion-button>
            <ion-button
              v-if="canDelete(u)"
              fill="clear"
              color="danger"
              slot="end"
              @click="confirmDelete(u)"
            >
              <ion-icon :icon="trashOutline" />
            </ion-button>
          </ion-item>
        </ion-list>
      </template>

      </div>

      <ion-fab class="mobile-fab" slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openForm()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="showForm" @did-dismiss="showForm = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editing ? $t('common.edit') : $t('common.add') }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showForm = false">{{ $t('common.cancel') }}</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-input v-model="form.name" :label="$t('user.name')" label-placement="floating" fill="outline" />
          <ion-input v-model="form.username" :label="$t('user.username')" label-placement="floating" fill="outline" class="ion-margin-top" :disabled="!!editing" />
          <ion-input v-model="form.password" :label="$t('user.password')" label-placement="floating" fill="outline" class="ion-margin-top" type="password" />
          <ion-select v-if="!editing" v-model="form.role" :label="$t('user.role')" label-placement="floating" fill="outline" class="ion-margin-top">
            <ion-select-option value="admin">Admin</ion-select-option>
            <ion-select-option value="operator">Operator</ion-select-option>
          </ion-select>
          <ion-select
            v-if="form.role === 'operator'"
            v-model="form.counter_id"
            :label="$t('user.counter')"
            label-placement="floating"
            fill="outline"
            class="ion-margin-top"
            interface="alert"
            :interface-options="{ cssClass: 'counter-select-alert' }"
          >
            <template v-for="group in countersByCategory" :key="group.category.id">
              <ion-select-option
                :value="undefined"
                disabled
                :class="`cat-color-${group.category.id}`"
              >
                {{ group.category.prefix }} — {{ group.category.name }}
              </ion-select-option>
              <ion-select-option v-for="c in group.counters" :key="c.id" :value="c.id">
                {{ group.category.prefix }}-{{ c.name }}
              </ion-select-option>
            </template>
          </ion-select>
          <ion-button expand="block" class="ion-margin-top" @click="save">{{ $t('common.save') }}</ion-button>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onUnmounted } from 'vue'
import {
  IonPage, IonContent, IonList, IonListHeader, IonItem, IonLabel,
  IonButton, IonButtons, IonIcon, IonFab, IonFabButton,
  IonModal, IonHeader, IonToolbar, IonTitle, IonInput,
  IonSelect, IonSelectOption, alertController, onIonViewWillEnter,
} from '@ionic/vue'
import { addIcons } from 'ionicons'
import { addOutline, pencilOutline, trashOutline } from 'ionicons/icons'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { usersApi, countersApi, categoriesApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import type { User, Counter, Category } from '@/types'

addIcons({ addOutline, pencilOutline, trashOutline })

const { t } = useI18n()
const auth  = useAuthStore()

const users      = ref<User[]>([])
const counters   = ref<Counter[]>([])
const categories = ref<Category[]>([])
const showForm   = ref(false)
const editing  = ref<User | null>(null)
const form     = ref({ name: '', username: '', password: '', role: 'operator' as 'admin' | 'operator', counter_id: undefined as number | undefined })

onIonViewWillEnter(load)

async function load() {
  const [u, c, cat] = await Promise.all([usersApi.list(), countersApi.list(), categoriesApi.list()])
  users.value = u.data; counters.value = c.data; categories.value = cat.data
}

const countersByCategory = computed(() => {
  return categories.value
    .map(cat => ({
      category: cat,
      counters: counters.value.filter(c => c.category_id === cat.id),
    }))
    .filter(g => g.counters.length > 0)
})

const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length)

const groupedUsers = computed(() => {
  const groups: { key: string; label: string; headerColor: string; users: User[] }[] = []

  const admins = users.value.filter(u => u.role === 'admin')
  if (admins.length) groups.push({ key: 'admin', label: 'Admin', headerColor: 'var(--ion-color-primary)', users: admins })

  const operators = users.value.filter(u => u.role === 'operator')
  if (operators.length) {
    categories.value.forEach(cat => {
      const inCat = operators.filter(u => {
        const counter = counters.value.find(c => c.id === u.counter_id)
        return counter?.category_id === cat.id
      })
      if (inCat.length) groups.push({ key: `cat-${cat.id}`, label: `${cat.prefix} — ${cat.name}`, headerColor: cat.color, users: inCat })
    })
    const unassigned = operators.filter(u => !u.counter_id || !counters.value.find(c => c.id === u.counter_id))
    if (unassigned.length) groups.push({ key: 'unassigned', label: 'Operator', headerColor: 'var(--ion-color-medium)', users: unassigned })
  }

  return groups
})

let _styleEl: HTMLStyleElement | null = null
watchEffect(() => {
  const rules = countersByCategory.value.map(g =>
    `.counter-select-alert .alert-radio-button.cat-color-${g.category.id} { background: ${g.category.color} !important; }
     .counter-select-alert .alert-radio-button.cat-color-${g.category.id} .alert-radio-label { color: #fff !important; font-weight: 600 !important; }`
  ).join('\n')
  if (!_styleEl) {
    _styleEl = document.createElement('style')
    _styleEl.id = 'counter-cat-colors'
    document.head.appendChild(_styleEl)
  }
  _styleEl.textContent = rules
})
onUnmounted(() => { _styleEl?.remove(); _styleEl = null })

function counterLabel(id: number) {
  const counter = counters.value.find(c => c.id === id)
  if (!counter) return ''
  const prefix = categories.value.find(cat => cat.id === counter.category_id)?.prefix ?? ''
  const name = prefix ? `${prefix}-${counter.name}` : counter.name
  return `${t('counter.label')}: ${name}`
}

function canDelete(u: User): boolean {
  if (u.id === auth.id) return false
  if (u.role === 'admin' && adminCount.value <= 1) return false
  return true
}

function openForm(u?: User) {
  editing.value = u ?? null
  form.value = u
    ? { name: u.name, username: u.username, password: '', role: u.role, counter_id: u.counter_id }
    : { name: '', username: '', password: '', role: 'operator', counter_id: undefined }
  showForm.value = true
}

async function save() {
  const payload = { ...form.value } as Record<string, unknown>
  if (!payload.password) delete payload.password
  if (editing.value) await usersApi.update(editing.value.id, payload as Parameters<typeof usersApi.update>[1])
  else await usersApi.create(payload as Parameters<typeof usersApi.create>[0])
  showForm.value = false; await load()
}

async function confirmDelete(u: User) {
  const alert = await alertController.create({
    header:  t('common.delete'),
    message: t('common.confirm_delete'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('common.delete'), role: 'destructive', handler: () => doDelete(u) },
    ],
  })
  await alert.present()
}

async function doDelete(u: User) {
  await usersApi.remove(u.id)
  await load()
}
</script>

<style scoped>
.page-body { padding: 24px 16px 48px; min-height: 100%; background: var(--color-surface-alt); }
.page-body > * { max-width: 480px; }
</style>
