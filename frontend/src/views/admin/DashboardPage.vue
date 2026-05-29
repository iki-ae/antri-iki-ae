<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.dashboard') }}</h2>
        </div>
        <QueueBoard :state="queueStore.state" />
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { onUnmounted } from 'vue'
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue'
import { useQueueStore } from '@/stores/queue'
import QueueBoard from '@/components/QueueBoard.vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
const queueStore = useQueueStore()
onIonViewWillEnter(() => queueStore.connect())
onUnmounted(() => queueStore.disconnect())
</script>
<style scoped>
.page-body { padding: 24px 16px 48px; min-height: 100%; background: var(--color-surface-alt); }
</style>
