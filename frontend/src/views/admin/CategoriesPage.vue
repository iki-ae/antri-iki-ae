<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('admin.nav.categories') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openForm()"><ion-icon name="add-outline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item v-for="cat in categories" :key="cat.id">
          <div slot="start" class="color-dot" :style="{ background: cat.color }" />
          <ion-label>
            <h2>{{ cat.prefix }} — {{ cat.name }}</h2>
          </ion-label>
          <ion-button fill="clear" slot="end" @click="openForm(cat)"><ion-icon name="pencil-outline" /></ion-button>
        </ion-item>
      </ion-list>

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
    <WatermarkFooter variant="subtle" />
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonInput, onIonViewWillEnter } from '@ionic/vue'
import { categoriesApi } from '@/api'
import type { Category } from '@/types'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
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
async function save() {
  if (editing.value) await categoriesApi.update(editing.value.id, form.value)
  else await categoriesApi.create(form.value)
  showForm.value = false
  await load()
}
</script>
<style scoped>
.color-dot { width: 20px; height: 20px; border-radius: 50%; margin-right: 8px; }
.color-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.color-picker { width: 40px; height: 32px; border: none; padding: 0; cursor: pointer; border-radius: 4px; }
</style>
