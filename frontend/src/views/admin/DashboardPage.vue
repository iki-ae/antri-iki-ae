<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>{{ $t('admin.nav.dashboard') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <QueueBoard :state="queueStore.state" />
    </ion-content>
    <WatermarkFooter variant="subtle" />
  </ion-page>
</template>
<script setup lang="ts">
import { onUnmounted } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter } from '@ionic/vue'
import { useQueueStore } from '@/stores/queue'
import QueueBoard from '@/components/QueueBoard.vue'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
const queueStore = useQueueStore()
onIonViewWillEnter(() => queueStore.connect())
onUnmounted(() => queueStore.disconnect())
</script>
