<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.backup') }}</h2>
        </div>
      <ion-card>
        <ion-card-header><ion-card-title>{{ $t('backup.export') }}</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>{{ $t('backup.exportDesc') }}</p>
          <ion-button expand="block" :href="backupApi.exportUrl" target="_blank">
            <ion-icon slot="start" name="cloud-download-outline" />
            {{ $t('backup.download') }}
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card class="ion-margin-top">
        <ion-card-header><ion-card-title>{{ $t('backup.import') }}</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>{{ $t('backup.importDesc') }}</p>
          <input type="file" accept=".zip" @change="onFile" style="margin-bottom: 1rem;" />
          <ion-button expand="block" :disabled="!selectedFile || importing" @click="doImport">
            <ion-spinner v-if="importing" name="crescent" />
            <span v-else>{{ $t('backup.restore') }}</span>
          </ion-button>
          <p v-if="importError" style="color: var(--ion-color-danger);">{{ importError }}</p>
        </ion-card-content>
      </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { IonPage, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonSpinner, toastController } from '@ionic/vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { backupApi } from '@/api'
const selectedFile = ref<File | null>(null)
const importing    = ref(false)
const importError  = ref('')
function onFile(e: Event) { selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null }
async function doImport() {
  if (!selectedFile.value) return
  importing.value = true; importError.value = ''
  try {
    await backupApi.import(selectedFile.value)
    const t = await toastController.create({ message: 'Import berhasil', duration: 2000, color: 'success' })
    await t.present()
  } catch (err: unknown) {
    importError.value = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Import gagal'
  } finally { importing.value = false }
}
</script>
<style scoped>
.page-body { padding: 24px 16px 48px; min-height: 100%; background: var(--color-surface-alt); }
.page-body > * { max-width: 480px; }
</style>
