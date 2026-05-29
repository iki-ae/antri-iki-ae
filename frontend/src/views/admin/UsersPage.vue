<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('admin.nav.users') }}</ion-title>
        <ion-buttons slot="end"><ion-button @click="openForm()"><ion-icon name="add-outline" /></ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item v-for="u in users" :key="u.id">
          <ion-label><h2>{{ u.name }}</h2><p>{{ u.username }} · {{ u.role }}</p></ion-label>
          <ion-button fill="clear" slot="end" @click="openForm(u)"><ion-icon name="pencil-outline" /></ion-button>
        </ion-item>
      </ion-list>
      <ion-modal :is-open="showForm" @did-dismiss="showForm = false">
        <ion-header><ion-toolbar>
          <ion-title>{{ editing ? $t('common.edit') : $t('common.add') }}</ion-title>
          <ion-buttons slot="end"><ion-button @click="showForm = false">{{ $t('common.cancel') }}</ion-button></ion-buttons>
        </ion-toolbar></ion-header>
        <ion-content class="ion-padding">
          <ion-input v-model="form.name" :label="$t('user.name')" label-placement="floating" fill="outline" />
          <ion-input v-model="form.username" :label="$t('user.username')" label-placement="floating" fill="outline" class="ion-margin-top" :disabled="!!editing" />
          <ion-input v-model="form.password" :label="$t('user.password')" label-placement="floating" fill="outline" class="ion-margin-top" type="password" />
          <ion-select v-model="form.role" :label="$t('user.role')" label-placement="floating" fill="outline" class="ion-margin-top">
            <ion-select-option value="admin">Admin</ion-select-option>
            <ion-select-option value="operator">Operator</ion-select-option>
          </ion-select>
          <ion-select v-if="form.role === 'operator'" v-model="form.counter_id" :label="$t('user.counter')" label-placement="floating" fill="outline" class="ion-margin-top">
            <ion-select-option v-for="c in counters" :key="c.id" :value="c.id">{{ c.name }}</ion-select-option>
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
import { usersApi, countersApi } from '@/api'
import type { User, Counter } from '@/types'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
const users    = ref<User[]>([])
const counters = ref<Counter[]>([])
const showForm = ref(false)
const editing  = ref<User | null>(null)
const form     = ref({ name: '', username: '', password: '', role: 'operator' as 'admin'|'operator', counter_id: undefined as number|undefined })
onIonViewWillEnter(load)
async function load() {
  const [u, c] = await Promise.all([usersApi.list(), countersApi.list()])
  users.value = u.data; counters.value = c.data
}
function openForm(u?: User) {
  editing.value = u ?? null
  form.value = u ? { name: u.name, username: u.username, password: '', role: u.role, counter_id: u.counter_id } : { name: '', username: '', password: '', role: 'operator', counter_id: undefined }
  showForm.value = true
}
async function save() {
  const payload = { ...form.value } as Record<string, unknown>
  if (!payload.password) delete payload.password
  if (editing.value) await usersApi.update(editing.value.id, payload as Parameters<typeof usersApi.update>[1])
  else await usersApi.create(payload as Parameters<typeof usersApi.create>[0])
  showForm.value = false; await load()
}
</script>
