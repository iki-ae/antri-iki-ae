<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.categories') }}</h2>
          <button class="card-add-btn desktop-only" @click="openForm()">
            <ion-icon :icon="addOutline" />
          </button>
        </div>
        <ion-list>
          <ion-item v-for="cat in categories" :key="cat.id">
            <div slot="start" class="color-dot" :style="{ background: cat.color }" />
            <ion-label>
              <h2>{{ cat.prefix }} — {{ cat.name }}</h2>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="openForm(cat)"><ion-icon :icon="pencilOutline" /></ion-button>
            <ion-button fill="clear" slot="end" color="danger" @click="confirmDelete(cat)"><ion-icon :icon="trashOutline" /></ion-button>
          </ion-item>
        </ion-list>
      </div>

      <ion-fab class="mobile-fab" slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openForm()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="showForm" @did-dismiss="showForm = false">
        <ion-header><ion-toolbar>
          <ion-title>{{ editing ? $t('common.edit') : $t('common.add') }}</ion-title>
          <ion-buttons slot="end"><ion-button @click="showForm = false">{{ $t('common.cancel') }}</ion-button></ion-buttons>
        </ion-toolbar></ion-header>
        <ion-content class="ion-padding">
          <ion-input v-model="form.prefix" :label="$t('category.prefix')" label-placement="floating" fill="outline" :maxlength="2" />
          <ion-input v-model="form.name" :label="$t('category.name')" label-placement="floating" fill="outline" class="ion-margin-top" />
          <div class="color-row ion-margin-top">
            <ion-label>{{ $t('category.color') }}</ion-label>
            <input type="color" v-model="form.color" class="color-picker" />
          </div>
          <ion-button expand="block" class="ion-margin-top" @click="save">{{ $t('common.save') }}</ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonInput, IonFab, IonFabButton, alertController, onIonViewWillEnter } from '@ionic/vue'
import { addIcons } from 'ionicons'
import { addOutline, pencilOutline, trashOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { categoriesApi } from '@/api'
import type { Category } from '@/types'

addIcons({ addOutline, pencilOutline, trashOutline })
const { t } = useI18n()
const categories = ref<Category[]>([])
const showForm   = ref(false)
const editing    = ref<Category | null>(null)
const form       = ref({ prefix: '', name: '', color: '#378ADD' })
onIonViewWillEnter(load)
async function load() { const { data } = await categoriesApi.list(); categories.value = data }
function openForm(cat?: Category) {
  editing.value = cat ?? null
  form.value = cat ? { prefix: cat.prefix, name: cat.name, color: cat.color } : { prefix: '', name: '', color: '#378ADD' }
  showForm.value = true
}
async function confirmDelete(cat: Category) {
  const alert = await alertController.create({
    header: t('common.confirm_delete'),
    message: `${cat.prefix} — ${cat.name}`,
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('common.delete'), role: 'destructive', handler: async () => { await categoriesApi.remove(cat.id); await load() } },
    ],
  })
  await alert.present()
}
async function save() {
  if (editing.value) await categoriesApi.update(editing.value.id, form.value)
  else await categoriesApi.create(form.value)
  showForm.value = false
  await load()
}
</script>
<style scoped>
.page-body { padding: 24px 16px 48px; min-height: 100%; background: var(--color-surface-alt); }
.page-body > * { max-width: 480px; }
.color-dot { width: 20px; height: 20px; border-radius: 50%; margin-right: 8px; }
.color-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.color-picker { width: 40px; height: 32px; border: none; padding: 0; cursor: pointer; border-radius: 4px; }
</style>
