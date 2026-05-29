<template>
  <ion-page>
    <AdminPageHeader :title="$t('admin.nav.config')" />
    <ion-content class="ion-padding">
      <ion-list v-if="form">
        <ion-item>
          <ion-input v-model="form.institution_name" :label="$t('config.institutionName')" label-placement="floating" fill="outline" />
        </ion-item>
        <ion-item class="ion-margin-top">
          <ion-select v-model="form.locale" :label="$t('config.locale')" label-placement="floating" fill="outline">
            <ion-select-option value="id">Bahasa Indonesia</ion-select-option>
            <ion-select-option value="en">English</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item class="ion-margin-top">
          <ion-input v-model="form.watermark_url" :label="$t('config.watermarkUrl')" label-placement="floating" fill="outline" />
        </ion-item>
        <ion-item class="ion-margin-top">
          <ion-label>{{ $t('config.watermarkPreview') }}</ion-label>
        </ion-item>
        <div class="watermark-preview">{{ configStore.watermarkText }}</div>
      </ion-list>
      <ion-button expand="block" class="ion-margin-top" @click="save">{{ $t('common.save') }}</ion-button>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonLabel, IonButton, onIonViewWillEnter, toastController } from '@ionic/vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { useI18n } from 'vue-i18n'
import { configApi } from '@/api'
import { useConfigStore } from '@/stores/config'
import type { Config } from '@/types'

const { t } = useI18n()
const configStore = useConfigStore()
const form = ref<Partial<Config> | null>(null)
onIonViewWillEnter(load)
async function load() { const { data } = await configApi.get(); form.value = { ...data } }
async function save() {
  if (!form.value) return
  await configApi.update(form.value)
  await configStore.load()
  const toast = await toastController.create({ message: t('common.success'), duration: 1500, position: 'bottom', color: 'success' })
  await toast.present()
}
</script>
<style scoped>
.watermark-preview { text-align: center; padding: 0.5rem; font-size: 0.75rem; color: var(--ion-color-medium); }
</style>
