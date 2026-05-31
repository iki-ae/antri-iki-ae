<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.counters') }}</h2>
          <button class="card-add-btn desktop-only" @click="openForm()">
            <ion-icon :icon="addOutline" />
          </button>
        </div>

        <div v-for="cat in categories" :key="cat.id" class="category-card">
          <div class="category-header" :style="{ background: cat.color }">
            <span class="category-label">{{ cat.prefix }} — {{ cat.name }}</span>
          </div>
          <div class="category-body">
            <ion-list lines="full" class="counter-list">
              <ion-item v-for="c in countersByCategory(cat.id)" :key="c.id">
                <ion-label><h2>{{ cat.prefix }}-{{ c.name }}</h2></ion-label>
                <ion-button fill="clear" slot="end" @click="openForm(c)">
                  <ion-icon :icon="pencilOutline" />
                </ion-button>
                <ion-button fill="clear" slot="end" color="danger" @click="remove(c)">
                  <ion-icon :icon="trashOutline" />
                </ion-button>
              </ion-item>
              <ion-item v-if="countersByCategory(cat.id).length === 0" lines="none">
                <ion-label color="medium"><p>{{ $t('counter.none') }}</p></ion-label>
              </ion-item>
            </ion-list>
          </div>
        </div>
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
          <ion-select v-model="form.category_id" :label="$t('counter.category')" label-placement="floating" fill="outline">
            <ion-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.prefix }} — {{ cat.name }}</ion-select-option>
          </ion-select>
          <ion-input v-model="form.name" :label="$t('counter.name')" label-placement="floating" fill="outline" class="ion-margin-top" />
          <ion-button expand="block" class="ion-margin-top" @click="save">{{ $t('common.save') }}</ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonInput, IonSelect, IonSelectOption, IonFab, IonFabButton, onIonViewWillEnter } from '@ionic/vue'
import { addIcons } from 'ionicons'
import { addOutline, pencilOutline, trashOutline } from 'ionicons/icons'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { countersApi, categoriesApi } from '@/api'
import { useQueueStore } from '@/stores/queue'
import type { Counter, Category } from '@/types'

addIcons({ addOutline, pencilOutline, trashOutline })

const queueStore = useQueueStore()
const counters   = ref<Counter[]>([])
const categories = ref<Category[]>([])
const showForm   = ref(false)
const editing    = ref<Counter | null>(null)
const form       = ref({ name: '', category_id: 0 })

onIonViewWillEnter(() => { queueStore.connect(); load() })

watch(() => queueStore.state, async () => {
  const cats = await categoriesApi.list()
  categories.value = cats.data
})

async function load() {
  const [c, cats] = await Promise.all([countersApi.list(), categoriesApi.list()])
  counters.value = c.data; categories.value = cats.data
}

function countersByCategory(catId: number) {
  return counters.value.filter(c => c.category_id === catId)
}

function openForm(c?: Counter) {
  editing.value = c ?? null
  form.value = c
    ? { name: c.name, category_id: c.category_id }
    : { name: '', category_id: categories.value[0]?.id ?? 0 }
  showForm.value = true
}

async function remove(c: Counter) {
  await countersApi.remove(c.id)
  await load()
}

async function save() {
  if (editing.value) await countersApi.update(editing.value.id, form.value)
  else await countersApi.create(form.value)
  showForm.value = false; await load()
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
  padding: 10px 16px;
}

.category-label {
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-body {
  padding: 0;
}

.counter-list {
  background: transparent;
}

.counter-list ion-item {
  --background: transparent;
  --padding-start: 16px;
  --inner-padding-end: 8px;
}
</style>
