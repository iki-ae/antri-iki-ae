<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="sidebar.toggle()" aria-label="Menu">
          <ion-icon :icon="menuOutline" slot="icon-only" />
        </ion-button>
      </ion-buttons>

      <ion-title>{{ configStore.institutionName }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/vue'
import { addIcons } from 'ionicons'
import { menuOutline } from 'ionicons/icons'
import { useSidebarStore } from '@/stores/sidebar'
import { useConfigStore } from '@/stores/config'

addIcons({ menuOutline })

const sidebar     = useSidebarStore()
const configStore = useConfigStore()
</script>
