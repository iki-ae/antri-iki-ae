<template>
  <ion-page>
    <ion-split-pane content-id="main-content">
      <ion-menu content-id="main-content">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ configStore.config?.institution_name ?? 'Admin' }}</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-menu-toggle v-for="item in menuItems" :key="item.path" :auto-hide="false">
              <ion-item :router-link="item.path" router-direction="root" :detail="false" lines="none" button>
                <ion-icon slot="start" :name="item.icon" />
                <ion-label>{{ $t(item.label) }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
          <div class="menu-footer">
            <ion-button fill="clear" expand="block" @click="doLogout">{{ $t('auth.logout') }}</ion-button>
          </div>
        </ion-content>
      </ion-menu>

      <ion-router-outlet id="main-content" />
    </ion-split-pane>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonButton, IonRouterOutlet } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

const router      = useRouter()
const auth        = useAuthStore()
const configStore = useConfigStore()

const menuItems = [
  { path: '/admin/dashboard',  icon: 'grid-outline',         label: 'admin.nav.dashboard'   },
  { path: '/admin/session',    icon: 'play-circle-outline',  label: 'admin.nav.session'     },
  { path: '/admin/categories', icon: 'layers-outline',       label: 'admin.nav.categories'  },
  { path: '/admin/counters',   icon: 'people-outline',       label: 'admin.nav.counters'    },
  { path: '/admin/users',      icon: 'person-outline',       label: 'admin.nav.users'       },
  { path: '/admin/config',     icon: 'settings-outline',     label: 'admin.nav.config'      },
  { path: '/admin/backup',     icon: 'cloud-download-outline', label: 'admin.nav.backup'    },
]

async function doLogout() { await auth.logout(); router.replace('/login') }
</script>

<style scoped>
.menu-footer { position: absolute; bottom: 0; width: 100%; padding: 1rem; }
</style>
