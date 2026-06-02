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
          <ion-button expand="block" :disabled="exporting" @click="doExport">
            <ion-spinner v-if="exporting" name="crescent" slot="start" />
            <ion-icon v-else :icon="cloudDownloadOutline" slot="start" />
            {{ $t('backup.download') }}
          </ion-button>
          <p v-if="exportError" style="color: var(--ion-color-danger);">{{ exportError }}</p>
        </ion-card-content>
      </ion-card>

      <ion-card class="ion-margin-top">
        <ion-card-header><ion-card-title>{{ $t('backup.import') }}</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>{{ $t('backup.importDesc') }}</p>
          <input type="file" accept=".db" @change="onFile" style="margin-bottom: 1rem;" />
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
import { useI18n } from 'vue-i18n'
import { IonPage, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonSpinner, toastController } from '@ionic/vue'
import { addIcons } from 'ionicons'
import { cloudDownloadOutline } from 'ionicons/icons'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { backupApi } from '@/api'

const { t } = useI18n()

addIcons({ cloudDownloadOutline })

const exporting    = ref(false)
const exportError  = ref('')
const selectedFile = ref<File | null>(null)
const importing    = ref(false)
const importError  = ref('')

function onFile(e: Event) { selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null }

async function doExport() {
  exporting.value = true; exportError.value = ''
  try {
    await backupApi.exportDownload()
  } catch {
    exportError.value = 'Export gagal'
  } finally { exporting.value = false }
}

async function doImport() {
  if (!selectedFile.value) return
  importing.value = true; importError.value = ''
  try {
    await backupApi.import(selectedFile.value)
    const toast = await toastController.create({ message: t('backup.success'), duration: 2000, color: 'success' })
    await toast.present()
  } catch (err: unknown) {
    importError.value = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Import gagal'
  } finally { importing.value = false }
}
</script>
<style scoped>
.page-body { padding: 24px 16px 48px; min-height: 100%; background: var(--color-surface-alt); }
.page-body > * { max-width: 480px; }
</style>
