<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('admin.nav.counters') }}</ion-title>
        <ion-buttons slot="end"><ion-button @click="openForm()"><ion-icon name="add-outline" /></ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item v-for="c in counters" :key="c.id">
          <ion-label><h2>{{ c.name }}</h2><p>{{ categoryName(c.category_id) }}</p></ion-label>
          <ion-button fill="clear" slot="end" @click="openForm(c)"><ion-icon name="pencil-outline" /></ion-button>
        </ion-item>
      </ion-list>
      <ion-modal :is-open="showForm" @did-dismiss="showForm = false">
        <ion-header><ion-toolbar>
          <ion-title>{{ editing ? $t('common.edit') : $t('common.add') }}</ion-title>
          <ion-buttons slot="end"><ion-button @click="showForm = false">{{ $t('common.cancel') }}</ion-button></ion-buttons>
        </ion-toolbar></ion-header>
        <ion-content class="ion-padding">
          <ion-input v-model="form.name" :label="$t('counter.name')" label-placement="floating" fill="outline" />
          <ion-select v-model="form.category_id" :label="$t('counter.category')" label-placement="floating" fill="outline" class="ion-margin-top">
            <ion-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.prefix }} — {{ cat.name }}</ion-select-option>
          </ion-select>
          <ion-button expand="block" class="ion-margin-top" @click="save">{{ $t('common.save') }}</ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
    <WatermarkFooter variant="subtle" />
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonInput, IonSelect, IonSelectOption, onIonViewWillEnter } from '@ionic/vue'
import { countersApi, categoriesApi } from '@/api'
import type { Counter, Category } from '@/types'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
const counters   = ref<Counter[]>([])
const categories = ref<Category[]>([])
const showForm   = ref(false)
const editing    = ref<Counter | null>(null)
const form       = ref({ name: '', category_id: 0 })
onIonViewWillEnter(load)
async function load() {
  const [c, cats] = await Promise.all([countersApi.list(), categoriesApi.list()])
  counters.value = c.data; categories.value = cats.data
}
function categoryName(id: number) { return categories.value.find(c => c.id === id)?.name ?? '' }
function openForm(c?: Counter) {
  editing.value = c ?? null
  form.value = c ? { name: c.name, category_id: c.category_id } : { name: '', category_id: categories.value[0]?.id ?? 0 }
  showForm.value = true
}
async function save() {
  if (editing.value) await countersApi.update(editing.value.id, form.value)
  else await countersApi.create(form.value)
  showForm.value = false; await load()
}
</script>
