<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="sidebar.toggle()" aria-label="Menu">
          <ion-icon :icon="menuOutline" slot="icon-only" />
        </ion-button>
      </ion-buttons>

      <ion-title>{{ title }}</ion-title>

      <ion-buttons slot="end">
        <slot name="end" />
        <ion-button @click="doLogout" aria-label="Logout">
          <ion-icon :icon="logOutOutline" slot="icon-only" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/vue'
import { addIcons } from 'ionicons'
import { menuOutline, logOutOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'

addIcons({ menuOutline, logOutOutline })

defineProps<{ title: string }>()

const router  = useRouter()
const auth    = useAuthStore()
const sidebar = useSidebarStore()

async function doLogout() {
  await auth.logout()
  router.replace('/login')
}
</script>
