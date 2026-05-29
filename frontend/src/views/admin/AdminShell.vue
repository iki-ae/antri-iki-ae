<template>
  <ion-page class="shell">

    <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
    <aside :class="['sidebar', { 'sidebar--open': sidebar.isOpen }]">

      <!-- Brand header -->
      <a class="sidebar-brand" :href="configStore.watermarkUrl" target="_blank" rel="noopener">
        <div class="sidebar-brand-text">
          powered by
          <strong>iki.ae</strong>
        </div>
        <div class="sidebar-brand-qr">
          <img src="@/assets/qr-iki-ae.svg" alt="iki.ae" width="28" height="28" />
        </div>
      </a>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <button
          v-for="item in menuItems"
          :key="item.path"
          :class="['nav-item', { 'nav-item--active': isActive(item.path) }]"
          @click="navigateTo(item.path)"
        >
          <ion-icon :icon="icons[item.iconKey]" class="nav-icon" />
          <span>{{ $t(item.label) }}</span>
        </button>
      </nav>

      <!-- User footer -->
      <div class="sidebar-user">
        <ion-icon :icon="icons.personCircleOutline" class="user-avatar" />
        <span class="user-name">{{ auth.name }}</span>
      </div>

    </aside>

    <!-- Mobile backdrop -->
    <div v-if="sidebar.isOpen && sidebar.isMobile" class="backdrop" @click="sidebar.toggle()" />

    <!-- ── Main ───────────────────────────────────────────────────────── -->
    <div class="main">
      <ion-router-outlet />
    </div>

  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonIcon, IonRouterOutlet } from '@ionic/vue'
import { addIcons } from 'ionicons'
import {
  gridOutline, playCircleOutline, layersOutline, peopleOutline,
  personOutline, settingsOutline, cloudDownloadOutline,
  personCircleOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { useSidebarStore } from '@/stores/sidebar'

addIcons({
  gridOutline, playCircleOutline, layersOutline, peopleOutline,
  personOutline, settingsOutline, cloudDownloadOutline,
  personCircleOutline,
})

const icons = {
  gridOutline, playCircleOutline, layersOutline, peopleOutline,
  personOutline, settingsOutline, cloudDownloadOutline,
  personCircleOutline,
}

const MOBILE_BP = 900

const router      = useRouter()
const route       = useRoute()
const auth        = useAuthStore()
const configStore = useConfigStore()
const sidebar     = useSidebarStore()

function onResize() { sidebar.setMobile(window.innerWidth < MOBILE_BP) }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const menuItems = [
  { path: '/admin/dashboard',  iconKey: 'gridOutline',          label: 'admin.nav.dashboard'  },
  { path: '/admin/session',    iconKey: 'playCircleOutline',    label: 'admin.nav.session'    },
  { path: '/admin/categories', iconKey: 'layersOutline',        label: 'admin.nav.categories' },
  { path: '/admin/counters',   iconKey: 'peopleOutline',        label: 'admin.nav.counters'   },
  { path: '/admin/users',      iconKey: 'personOutline',        label: 'admin.nav.users'      },
  { path: '/admin/config',     iconKey: 'settingsOutline',      label: 'admin.nav.config'     },
  { path: '/admin/backup',     iconKey: 'cloudDownloadOutline', label: 'admin.nav.backup'     },
] as const

function isActive(path: string) { return route.path === path }

function navigateTo(path: string) {
  if (sidebar.isMobile) sidebar.toggle()
  router.push(path)
}
</script>

<style scoped>
/* ── Shell layout ─────────────────────────────────────────────────────────── */

.shell {
  display: flex !important;
  flex-direction: row !important;
  overflow: hidden;
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */

.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: 200;
  transition: margin-left 0.25s ease;
}

/* Brand header */
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 14px 0 18px;
  height: 56px;
  min-height: 56px;
  background: var(--color-accent);
  text-decoration: none;
  gap: 10px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.sidebar-brand-text {
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.75);
  text-align: right;
}

.sidebar-brand-text strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.sidebar-brand-qr {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: #ffffff;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-family: var(--font-family);
  color: var(--color-text);
  text-align: left;
  transition: background 0.15s;
}

.nav-item:hover {
  background: var(--color-surface-alt);
}

.nav-item--active {
  background: var(--color-primary);
  color: #ffffff;
  font-weight: 600;
}

.nav-item--active:hover {
  background: var(--color-primary-dark);
}

.nav-icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* User footer */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.user-avatar {
  font-size: 28px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Sidebar collapsed (desktop) ─────────────────────────────────────────── */

@media (min-width: 900px) {
  .sidebar:not(.sidebar--open) {
    margin-left: -260px;
  }
}

/* ── Mobile: sidebar as overlay drawer ────────────────────────────────────── */

@media (max-width: 899px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar--open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }
}

/* Backdrop (mobile only) */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 199;
}

/* ── Main content area ────────────────────────────────────────────────────── */

.main {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Child pages rendered by ion-router-outlet fill the main column */
.main :deep(ion-page) {
  position: relative !important;
  contain: layout style !important;
}

/* Accent toolbars in child page headers */
.main :deep(ion-toolbar) {
  --background: var(--color-accent);
  --color: #ffffff;
}

.main :deep(ion-toolbar ion-title),
.main :deep(ion-toolbar ion-button),
.main :deep(ion-toolbar ion-back-button) {
  color: #ffffff;
}

/* Modal toolbars keep the default primary color */
.main :deep(ion-modal ion-toolbar) {
  --background: var(--color-primary);
}
</style>
