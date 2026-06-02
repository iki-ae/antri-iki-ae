<template>
  <div class="kiosk-root">

    <!-- Header -->
    <div class="kiosk-header">
      <h1 class="institution-name">{{ configStore.config?.institution_name || 'antri.iki.ae' }}</h1>
      <a class="watermark-block" href="https://iki.ae" target="_blank" rel="noopener">
        <div class="watermark-text">powered by<strong>iki.ae</strong></div>
        <div class="watermark-qr">
          <img src="@/assets/qr-iki-ae.svg" alt="iki.ae" width="28" height="28" />
        </div>
      </a>
    </div>

    <!-- Centred column — mobile-width on desktop -->
    <div class="kiosk-body">
      <div class="kiosk-column">

        <!-- Ticket preview card -->
        <div class="preview-card" :class="{ 'preview-card--active': !!issued }">
          <Transition name="fade" mode="out-in">

            <!-- Issued state — thermal slip preview -->
            <div v-if="issued" key="issued" class="slip-preview">
              <div class="slip-institution">{{ configStore.config?.institution_name || 'antri.iki.ae' }}</div>
              <div class="slip-category">{{ issuedCategoryName }}</div>
              <div class="slip-divider" />
              <div class="slip-number" :style="{ color: issuedColor }">{{ issued }}</div>
              <div class="slip-divider" />
              <div class="slip-datetime">{{ issuedAt }}</div>
            </div>

            <!-- Idle state -->
            <div v-else key="idle" class="preview-idle">
              <ion-icon :icon="ticketOutline" class="idle-icon" />
            </div>

          </Transition>
        </div>

        <!-- Category list — always rendered, one row per category -->
        <div class="category-section">
          <div class="category-list">
            <button
              v-for="cat in allCategories"
              :key="cat.id"
              class="category-btn"
              :class="{ 'category-btn--disabled': !cat.available }"
              :style="{ '--cat': cat.color }"
              :disabled="!cat.available || taking"
              @click="take(cat.id)"
            >
              <span class="cat-prefix">{{ cat.prefix }}</span>
              <div class="cat-right">
                <span class="cat-name">{{ cat.name }}</span>
                <div class="cat-stats">
                  <span class="cat-stat">{{ $t('session.served') }}: {{ cat.served }}</span>
                  <span class="cat-stat-sep">|</span>
                  <span class="cat-stat">{{ $t('operator.waiting') }}: {{ cat.waiting }}</span>
                </div>
              </div>
              <span v-if="cat.quota_full" class="cat-quota-badge">{{ $t('kiosk.quotaFull') }}</span>
            </button>
          </div>

          <!-- No categories at all -->
          <div v-if="allCategories.length === 0" class="no-categories">
            <ion-icon :icon="timeOutline" class="no-cat-icon" />
            <p>{{ $t('kiosk.unavailable') }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { IonIcon } from '@ionic/vue'
import { addIcons } from 'ionicons'
import { timeOutline, ticketOutline } from 'ionicons/icons'
import { displayApi, kioskApi } from '@/api'
import { useConfigStore } from '@/stores/config'
import { useQueueStore } from '@/stores/queue'
import { printSingleKiosk } from '@/utils/print'
import type { Category } from '@/types'

addIcons({ timeOutline, ticketOutline })

const { t } = useI18n()
const configStore = useConfigStore()
const queueStore  = useQueueStore()

// All categories from the queue state (for display)
const kioskCategories  = ref<Category[]>([])                          // kiosk-mode categories (clickable)
const kioskQuotaFull   = ref<Record<number, boolean>>({})             // category_id → quota full flag
const allCategoryList  = ref<Category[]>([])                          // every category in any open session
const sessionModeMap   = ref<Record<number, 'kiosk' | 'bulk'>>({})   // category_id → mode

const issued              = ref<string | null>(null)
const issuedColor         = ref('#e08c2f')
const issuedCategoryName  = ref('')
const issuedAt            = ref('')
const taking = ref(false)

// Build a merged list: all categories in any open session, with availability + live stats
const allCategories = computed(() => {
  const waitingMap: Record<number, number> = {}
  for (const w of queueStore.state?.waiting ?? []) waitingMap[w.category_id] = w.count

  const servedMap: Record<number, number> = {}
  for (const s of queueStore.state?.served ?? []) servedMap[s.category_id] = s.count

  // SSE carries live category colors via counters[].category — use them as the source of truth
  const colorMap: Record<number, string> = {}
  for (const c of queueStore.state?.counters ?? []) {
    if (c.category?.color) colorMap[c.category.id] = c.category.color
  }

  return allCategoryList.value.map(cat => {
    const mode      = sessionModeMap.value[cat.id]
    const quotaFull = kioskQuotaFull.value[cat.id] ?? false
    return {
      ...cat,
      color:      colorMap[cat.id] ?? cat.color,
      available:  mode === 'kiosk' && !quotaFull,
      quota_full: mode === 'kiosk' && quotaFull,
      waiting:    waitingMap[cat.id] ?? 0,
      served:     servedMap[cat.id]  ?? 0,
    }
  })
})

const categoryLabel = computed(() => {
  if (allCategories.value.length === 0) return ''
  const hasKiosk = allCategories.value.some(c => c.available)
  return hasKiosk ? t('kiosk.pickCategory') : t('kiosk.bulkHint')
})

onMounted(async () => {
  queueStore.connect()
  try {
    const [kioskRes, stateRes] = await Promise.all([kioskApi.status(), displayApi.state()])

    // Categories available for kiosk-mode sessions (clickable)
    kioskCategories.value = kioskRes.data.categories ?? []
    const quotaMap: Record<number, boolean> = {}
    for (const cat of kioskCategories.value as (Category & { quota_full?: boolean })[]) {
      quotaMap[cat.id] = cat.quota_full ?? false
    }
    kioskQuotaFull.value = quotaMap

    // Build category map from counters (each counter carries its category)
    const catMap = new Map<number, Category>()
    for (const counter of (stateRes.data.counters ?? [])) {
      const c = counter.category
      if (c && !catMap.has(c.id)) catMap.set(c.id, c as Category)
    }

    // Also add kiosk categories (in case no counters are active yet)
    for (const cat of kioskCategories.value) {
      if (!catMap.has(cat.id)) catMap.set(cat.id, cat)
    }

    // Build mode map from sessions
    const modeMap: Record<number, 'kiosk' | 'bulk'> = {}
    for (const s of (stateRes.data.sessions ?? [])) {
      if (s.category_id) modeMap[s.category_id] = s.mode as 'kiosk' | 'bulk'
    }
    // Ensure kiosk categories are always marked kiosk
    for (const cat of kioskCategories.value) {
      if (!modeMap[cat.id]) modeMap[cat.id] = 'kiosk'
    }

    sessionModeMap.value  = modeMap
    allCategoryList.value = [...catMap.values()].sort((a, b) => a.prefix.localeCompare(b.prefix))
  } catch {
    kioskCategories.value = []
    allCategoryList.value = []
    sessionModeMap.value  = {}
  }
})

onUnmounted(() => {
  queueStore.disconnect()
})

async function take(category_id: number) {
  taking.value = true
  try {
    const cat = allCategoryList.value.find(c => c.id === category_id)
    const { data } = await kioskApi.take(category_id)

    const createdAt = data.created_at ?? new Date().toISOString()
    issued.value             = data.display_number
    issuedColor.value        = cat?.color ?? 'var(--color-accent)'
    issuedCategoryName.value = cat ? `${cat.prefix} — ${cat.name}` : ''
    issuedAt.value           = new Date(createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })

    await printSingleKiosk({
      display_number:  data.display_number,
      session_title:   data.session_title ?? '',
      category_prefix: data.category_prefix ?? '',
      category_name:   data.category_name ?? '',
      created_at:      createdAt,
    }, configStore.config?.institution_name ?? 'antri.iki.ae')
  } finally {
    taking.value = false
  }
}
</script>

<style scoped>
/* ── Root ── */
.kiosk-root {
  width: 100vw;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-alt);
  font-family: var(--font-family);
  color: var(--color-text);
}

/* ── Header ── */
.kiosk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--color-accent);
  padding: 0 20px 0 24px;
  height: 56px;
  flex-shrink: 0;
}
.institution-name {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.watermark-block {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0,0,0,0.18);
  border-radius: 8px;
  padding: 6px 10px 6px 12px;
  text-decoration: none;
  flex-shrink: 0;
  transition: background 0.15s;
}
.watermark-block:hover { background: rgba(0,0,0,0.28); }
.watermark-text {
  font-size: 10px;
  line-height: 1.5;
  color: rgba(255,255,255,0.80);
  text-align: right;
}
.watermark-text strong {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.watermark-qr {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  background: #fff;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.watermark-qr img { width: 28px; height: 28px; display: block; }

/* ── Body — centres the column ── */
.kiosk-body {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px 40px;
}

/* ── Mobile-width column ── */
.kiosk-column {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Ticket preview card ── */
.preview-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.preview-card--active {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
}

/* Idle state inside preview */
.preview-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.idle-icon {
  font-size: 2.8rem;
  color: var(--color-border-dark);
}
.idle-text {
  font-size: 0.95rem;
  color: var(--color-text-light);
  margin: 0;
}

/* Slip preview inside card */
.slip-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  width: 100%;
  font-family: 'Courier New', Courier, monospace;
}
.slip-institution {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.03em;
}
.slip-category {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.slip-divider {
  width: 80%;
  border: none;
  border-top: 1px dashed var(--color-border-dark);
  margin: 2px 0;
}
.slip-number {
  font-size: clamp(2.8rem, 8vw, 4rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.slip-datetime {
  font-size: 0.7rem;
  color: var(--color-text-light);
}

/* ── Category section ── */
.category-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0;
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.category-btn {
  width: 100%;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--cat);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  color: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform 0.12s, box-shadow 0.12s, opacity 0.15s;
  text-align: left;
}
.category-btn:hover:not(:disabled):not(.category-btn--disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.category-btn:active:not(:disabled):not(.category-btn--disabled) {
  transform: scale(0.98);
}
.category-btn--disabled,
.category-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.3);
}
.cat-prefix {
  font-size: 2.4rem;
  font-weight: 900;
  line-height: 1;
  flex-shrink: 0;
  width: 52px;
  text-align: center;
}
.cat-right {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.cat-name {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  opacity: 0.75;
}
.cat-stat     { font-weight: 600; }
.cat-stat-sep { opacity: 0.5; }
.cat-quota-badge {
  margin-left: auto;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(0,0,0,0.25);
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── No categories ── */
.no-categories {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}
.no-cat-icon { font-size: 2rem; color: var(--color-border-dark); }

/* ── Fade transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
