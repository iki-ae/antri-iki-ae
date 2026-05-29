<template>
  <ion-page>
    <ion-content class="kiosk-content">

      <!-- Mode A: bulk session — branding holding screen -->
      <div v-if="isBulkMode" class="kiosk-branding">
        <h1 class="brand-title">antri.iki.ae</h1>
        <div class="brand-barcode">
          <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" aria-label="iki.ae">
            <rect x="0"   y="0" width="4"  height="80" fill="white" />
            <rect x="8"   y="0" width="2"  height="80" fill="white" />
            <rect x="14"  y="0" width="6"  height="80" fill="white" />
            <rect x="24"  y="0" width="2"  height="80" fill="white" />
            <rect x="30"  y="0" width="4"  height="80" fill="white" />
            <rect x="38"  y="0" width="2"  height="80" fill="white" />
            <rect x="44"  y="0" width="6"  height="80" fill="white" />
            <rect x="54"  y="0" width="2"  height="80" fill="white" />
            <rect x="60"  y="0" width="4"  height="80" fill="white" />
            <rect x="68"  y="0" width="2"  height="80" fill="white" />
            <rect x="74"  y="0" width="6"  height="80" fill="white" />
            <rect x="84"  y="0" width="4"  height="80" fill="white" />
            <rect x="92"  y="0" width="2"  height="80" fill="white" />
            <rect x="98"  y="0" width="6"  height="80" fill="white" />
            <rect x="108" y="0" width="2"  height="80" fill="white" />
            <rect x="114" y="0" width="4"  height="80" fill="white" />
            <rect x="122" y="0" width="6"  height="80" fill="white" />
            <rect x="132" y="0" width="2"  height="80" fill="white" />
            <rect x="138" y="0" width="4"  height="80" fill="white" />
            <rect x="146" y="0" width="2"  height="80" fill="white" />
            <rect x="152" y="0" width="6"  height="80" fill="white" />
            <rect x="162" y="0" width="4"  height="80" fill="white" />
            <rect x="170" y="0" width="2"  height="80" fill="white" />
            <rect x="176" y="0" width="6"  height="80" fill="white" />
            <rect x="186" y="0" width="4"  height="80" fill="white" />
            <rect x="194" y="0" width="6"  height="80" fill="white" />
          </svg>
          <p class="brand-label">iki.ae</p>
        </div>
        <p class="brand-sub">{{ $t('kiosk.bulkHint') }}</p>
      </div>

      <!-- Ticket issued (Mode B) -->
      <div v-else-if="issued" class="kiosk-result">
        <p class="kiosk-label">{{ $t('kiosk.yourNumber') }}</p>
        <TicketNumber :display-number="issued" color="#378ADD" />
        <p class="kiosk-countdown">{{ $t('kiosk.autoReset', { s: countdown }) }}</p>
      </div>

      <!-- Category picker (Mode B, session open) -->
      <div v-else-if="isKioskMode" class="kiosk-picker">
        <h1 class="kiosk-title">{{ configStore.config?.institution_name }}</h1>
        <p class="kiosk-subtitle">{{ $t('kiosk.pickCategory') }}</p>
        <div class="category-grid">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="category-btn"
            :style="{ background: cat.color }"
            :disabled="taking"
            @click="take(cat.id)"
          >
            <span class="cat-prefix">{{ cat.prefix }}</span>
            <span class="cat-name">{{ cat.name }}</span>
          </button>
        </div>
      </div>

      <!-- No session / unavailable -->
      <div v-else class="kiosk-unavailable">
        <ion-icon name="time-outline" style="font-size: 4rem; opacity: 0.3;" />
        <p>{{ $t('kiosk.unavailable') }}</p>
      </div>

      <WatermarkFooter />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import { displayApi, kioskApi, categoriesApi } from '@/api'
import { useConfigStore } from '@/stores/config'
import WatermarkFooter from '@/components/WatermarkFooter.vue'
import TicketNumber from '@/components/TicketNumber.vue'
import type { Category } from '@/types'

const configStore = useConfigStore()

const sessionMode = ref<string | null>(null)
const categories  = ref<Category[]>([])
const issued      = ref<string | null>(null)
const taking      = ref(false)
const countdown   = ref(10)
let   timer: ReturnType<typeof setInterval> | null = null

const isBulkMode  = computed(() => sessionMode.value === 'bulk')
const isKioskMode = computed(() => sessionMode.value === 'kiosk')

onMounted(async () => {
  try {
    const { data } = await displayApi.state()
    sessionMode.value = data.session?.mode ?? null
    if (sessionMode.value === 'kiosk') {
      const { data: cats } = await categoriesApi.list()
      categories.value = cats.filter(c => c.is_active)
    }
  } catch {
    sessionMode.value = null
  }
})

onUnmounted(() => { if (timer) clearInterval(timer) })

async function take(category_id: number) {
  taking.value = true
  try {
    const { data } = await kioskApi.take(category_id)
    issued.value   = data.display_number
    countdown.value = 10
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) reset()
    }, 1000)
  } finally {
    taking.value = false
  }
}

function reset() {
  if (timer) { clearInterval(timer); timer = null }
  issued.value    = null
  countdown.value = 10
}
</script>

<style scoped>
.kiosk-content { --background: #0a0a1a; color: white; }

.kiosk-picker, .kiosk-result, .kiosk-unavailable, .kiosk-branding {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* Mode A — bulk branding screen */
.kiosk-branding { gap: 2rem; }
.brand-title {
  font-size: clamp(2rem, 8vw, 5rem);
  font-weight: 900;
  letter-spacing: 0.04em;
  margin: 0;
  color: white;
}
.brand-barcode { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.brand-barcode svg { width: clamp(160px, 40vw, 320px); height: auto; }
.brand-label { font-size: clamp(1rem, 3vw, 2rem); font-weight: 700; margin: 0; letter-spacing: 0.06em; opacity: 0.9; }
.brand-sub { font-size: clamp(0.85rem, 2vw, 1.1rem); opacity: 0.4; margin: 0; }

/* Mode B — category picker */
.kiosk-title    { font-size: clamp(1.5rem, 4vw, 3rem); font-weight: 700; margin: 0 0 0.5rem; text-align: center; }
.kiosk-subtitle { opacity: 0.6; margin: 0 0 2rem; font-size: 1.1rem; }
.category-grid  { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; width: 100%; max-width: 700px; }
.category-btn   { min-height: 120px; border: none; border-radius: 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: white; transition: transform 0.1s; }
.category-btn:active { transform: scale(0.97); }
.cat-prefix     { font-size: 2.5rem; font-weight: 900; }
.cat-name       { font-size: 1rem; font-weight: 500; }

/* Result */
.kiosk-label     { font-size: 1.2rem; opacity: 0.7; margin-bottom: 1rem; }
.kiosk-countdown { margin-top: 2rem; opacity: 0.5; font-size: 0.9rem; }

/* Unavailable */
.kiosk-unavailable { opacity: 0.5; gap: 1rem; font-size: 1.2rem; }
</style>
