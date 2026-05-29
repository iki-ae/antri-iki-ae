<template>
  <ion-page>
    <AdminPageHeader :title="$t('admin.nav.dashboard')" />
    <ion-content class="ion-padding">
      <QueueBoard :state="queueStore.state" />
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
