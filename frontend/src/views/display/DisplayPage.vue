<template>
  <div class="display-root">

    <!-- ── Setup hint overlay ── -->
    <Transition name="overlay">
      <div v-if="showHint" class="hint-overlay">
        <div class="hint-box">
          <div class="hint-icon">🖥️</div>
          <p class="hint-title">{{ $t('display.hint.title') }}</p>
          <p class="hint-body">
            <i18n-t keypath="display.hint.body" tag="span">
              <template #resolution><strong>1024 × 768</strong></template>
              <template #key><strong>F11</strong></template>
            </i18n-t>
          </p>
          <button class="hint-btn" @click="showHint = false">{{ $t('display.hint.confirm') }}</button>
        </div>
      </div>
    </Transition>

    <div class="display-frame">

      <!-- ── Full-width header ── -->
      <div class="display-header">
        <h1 class="institution-name">{{ configStore.institutionName }}</h1>
        <a class="watermark-block" :href="configStore.watermarkUrl" target="_blank" rel="noopener">
          <div class="watermark-text">
            powered by
            <strong>iki.ae</strong>
          </div>
          <div class="watermark-qr">
            <img src="@/assets/qr-iki-ae.svg" alt="iki.ae" width="28" height="28" />
          </div>
        </a>
      </div>

      <!-- ── Body: 40% left / 60% right ── -->
      <div class="display-body">

        <!-- Last called -->
        <div class="panel-left">
          <div class="slot-current">
            <div class="last-card">
              <template v-if="displayCurrent">
                <div class="last-label">{{ $t('counter.label') }} {{ displayCurrent.prefix }}-{{ displayCurrent.counterName }}</div>
                <div class="last-number" :class="{ blinking: isBlinking }" :style="{ color: displayCurrent.color }">
                  {{ displayCurrent.displayNumber }}
                </div>
              </template>
              <div v-else class="last-idle">—</div>
            </div>
          </div>
          <div class="slot-previous">
            <div class="prev-card">
              <template v-if="prevCalled">
                <div class="prev-label">{{ $t('counter.label') }} {{ prevCalled.prefix }}-{{ prevCalled.counterName }}</div>
                <div class="prev-number" :style="{ color: prevCalled.color }">
                  {{ prevCalled.displayNumber }}
                </div>
              </template>
              <div v-else class="prev-idle">—</div>
            </div>
          </div>
        </div>

        <!-- Queue board -->
        <div class="panel-right">
          <div v-if="queue.state?.session" class="board-scroll">
            <div
              v-for="group in grouped"
              :key="group.category.id"
              class="category-section"
              :style="{ flexGrow: gridRows(group.counters.length) }"
            >
              <div class="category-header" :style="{ background: group.category.color }">
                <span class="category-name">{{ group.category.prefix }} — {{ group.category.name }}</span>
                <div class="header-badges">
                  <span v-if="waitingMap[group.category.id]" class="waiting-badge">
                    {{ $t('display.waiting', { count: waitingMap[group.category.id] }) }}
                  </span>
                </div>
              </div>
              <div class="counters-row">
                <div
                  v-for="counter in group.counters"
                  :key="counter.id"
                  class="counter-box"
                  :class="{ flashing: counter.id === flashingCounterId }"
                  :style="{ '--cat-color': group.category.color }"
                >
                  <div class="counter-title">
                    {{ $t('counter.label') }} {{ group.category.prefix }}-{{ counter.name }}
                  </div>
                  <TicketNumber
                    v-if="counter.currentTicket"
                    :display-number="counter.currentTicket.display_number"
                    :color="group.category.color"
                    size="sm"
                  />
                  <div v-else class="counter-idle">—</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="board-idle">
            <p>{{ $t('display.noSession') }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useI18n }        from 'vue-i18n'
import { useQueueStore }  from '@/stores/queue'
import type { AnnouncedTicket } from '@/stores/queue'
import type { QueueState } from '@/types'
import { useConfigStore } from '@/stores/config'
import TicketNumber       from '@/components/TicketNumber.vue'

const queue       = useQueueStore()
const configStore = useConfigStore()
const { t, locale } = useI18n()

type CalledEntry = { displayNumber: string; color: string; prefix: string; counterName: string; calledAt: string; counterId: number }

// ── Audio unlock ──────────────────────────────────────────────────────────────
let _audioUnlocked = false

function onPageClick() {
  if (_audioUnlocked) return
  _audioUnlocked = true
  if (!_announcing) processQueue()
}

function speakText(text: string) {
  const lang = locale.value === 'id' ? 'id-ID' : 'en-US'
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

// ── Announcement queue ────────────────────────────────────────────────────────
const BLINK_DURATION = 5000

const _queue: CalledEntry[] = []
let _announcing = false

const displayCurrent    = ref<CalledEntry | null>(null)
const prevCalled        = ref<CalledEntry | null>(null)
const isBlinking        = ref(false)
const flashingCounterId = ref<number | null>(null)
let blinkTimer: ReturnType<typeof setTimeout> | null = null

function enqueue(entry: CalledEntry) {
  const last = _queue[_queue.length - 1] ?? displayCurrent.value
  if (last && last.displayNumber === entry.displayNumber && last.calledAt === entry.calledAt) return
  _queue.push(entry)
  if (!_announcing) processQueue()
}

function processQueue() {
  if (_queue.length === 0) { _announcing = false; return }
  if (!_audioUnlocked)     { _announcing = false; return }

  _announcing = true
  const entry = _queue.shift()!

  if (displayCurrent.value && displayCurrent.value.displayNumber !== entry.displayNumber) {
    prevCalled.value = displayCurrent.value
  }
  displayCurrent.value = entry

  speakText(t('display.announce', {
    number:  entry.displayNumber,
    prefix:  entry.prefix,
    counter: entry.counterName,
  }))

  if (blinkTimer) clearTimeout(blinkTimer)
  isBlinking.value = false
  flashingCounterId.value = null

  requestAnimationFrame(() => {
    isBlinking.value = true
    flashingCounterId.value = entry.counterId
    blinkTimer = setTimeout(() => {
      isBlinking.value = false
      flashingCounterId.value = null
      processQueue()
    }, BLINK_DURATION)
  })
}

// ── SSE announce listener (fires per-message, before Vue batches) ─────────────
function handleAnnounce(ticket: AnnouncedTicket) {
  enqueue({
    counterId:     ticket.counterId,
    displayNumber: ticket.displayNumber,
    color:         ticket.color,
    prefix:        ticket.prefix,
    counterName:   ticket.counterName,
    calledAt:      ticket.calledAt,
  })
}

// ── Hint overlay ──────────────────────────────────────────────────────────────
const showHint = ref(true)

function toEntry(c: QueueState['counters'][0]): CalledEntry {
  return {
    counterId:     c.id,
    displayNumber: c.currentTicket!.display_number,
    color:         c.category.color,
    prefix:        c.category.prefix,
    counterName:   c.name,
    calledAt:      c.currentTicket!.called_at,
  }
}

function handleFirstState(state: QueueState) {
  // Seed display from page-load snapshot: top box = most recent, bottom box = second most recent
  const active = (state.counters ?? [])
    .filter(c => !!c.currentTicket)
    .sort((a, b) => b.currentTicket!.called_at.localeCompare(a.currentTicket!.called_at))
  if (active[0]) displayCurrent.value = toEntry(active[0])
  if (active[1]) prevCalled.value     = toEntry(active[1])
}

onMounted(() => {
  queue.connect()
  queue.onAnnounce(handleAnnounce)
  queue.onFirstState(handleFirstState)
  window.addEventListener('click', onPageClick)
})

onUnmounted(() => {
  queue.offAnnounce(handleAnnounce)
  queue.offFirstState(handleFirstState)
  queue.disconnect()
  window.removeEventListener('click', onPageClick)
  if (blinkTimer) clearTimeout(blinkTimer)
})

// ── Watch for done/skip clearing the displayed ticket ────────────────────────
// onAnnounce handles new calls. This watcher only handles the case where the
// currently-displayed ticket is cleared (done/skip) with no new call following.
watch(() => queue.state, (state) => {
  if (!displayCurrent.value) return
  const counters = state?.counters ?? []
  const shownCounter = counters.find(c => c.id === displayCurrent.value!.counterId)
  // If the counter that owns the displayed ticket no longer has an active ticket,
  // or has a different ticket (already handled by onAnnounce), clear the display.
  if (!shownCounter?.currentTicket || shownCounter.currentTicket.called_at !== displayCurrent.value!.calledAt) {
    // Only clear if there's nothing queued — a queued announcement will update the display itself
    if (_queue.length === 0 && !_announcing) {
      if (displayCurrent.value) prevCalled.value = displayCurrent.value
      displayCurrent.value = null
      isBlinking.value = false
      flashingCounterId.value = null
    }
  }
}, { deep: false })

// ── Board data ────────────────────────────────────────────────────────────────
const grouped = computed(() => {
  const counters = queue.state?.counters ?? []
  const map = new Map<number, { category: typeof counters[0]['category']; counters: typeof counters }>()
  for (const c of counters) {
    if (!map.has(c.category.id)) map.set(c.category.id, { category: c.category, counters: [] })
    map.get(c.category.id)!.counters.push(c)
  }
  return [...map.values()]
})

const waitingMap = computed(() => {
  const out: Record<number, number> = {}
  for (const w of queue.state?.waiting ?? []) out[w.category_id] = w.count
  return out
})

// Right panel width: 1024 - 390(left) - 16(gap) - 32(body padding) = 586px
// Counter min width: 110px, gap: 8px → floor((586+8)/(110+8)) = 5 columns
const COLS = 5
function gridRows(counterCount: number): number {
  return Math.ceil(counterCount / COLS)
}
</script>

<style scoped>
/* ── Centering shell — fills the whole viewport ── */
.display-root {
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-alt);
  overflow: hidden;
}

/* ── Fixed 1024×768 frame ── */
.display-frame {
  width: 1024px;
  height: 768px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-alt);
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(4,3,22,0.12);
}

/* ── Header (56px) ── */
.display-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--color-accent) !important;
  padding: 0 20px 0 24px;
  height: 56px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
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
  line-height: 1.4;
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

/* ── Body (768 - 56 = 712px tall) ── */
.display-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  min-height: 0;
  background: var(--color-surface-alt);
}

/* ── Left panel ── */
.panel-left {
  width: 390px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 16px;
}

.slot-current {
  flex: 7;
  display: flex;
  min-height: 0;
}

.slot-previous {
  flex: 3;
  display: flex;
  min-height: 0;
}

/* Current card */
.last-card {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 16px;
  text-align: center;
  overflow: hidden;
}

.last-label {
  font-size: 40px;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.last-number {
  font-size: 100px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  animation: pop 0.4s ease;
}

@keyframes pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@keyframes flash {
  0%   { background: color-mix(in srgb, var(--cat-color) 30%, white); }
  100% { background: var(--color-surface); }
}

.last-number.blinking {
  animation: blink 1s step-end 5;
}

.counter-box.flashing {
  animation: flash 5s ease-out 1 forwards;
}

.last-idle {
  font-size: 60px;
  color: var(--color-border-dark);
  font-weight: 700;
  line-height: 1;
}

/* Previous card */
.prev-card {
  width: 100%;
  background: #fefdff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  gap: 10px;
  text-align: center;
  overflow: hidden;
  opacity: 0.65;
}

.prev-label {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.prev-number {
  font-size: 68px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.prev-idle {
  font-size: 40px;
  color: var(--color-border-dark);
  font-weight: 700;
  line-height: 1;
}

/* ── Right panel: remaining ── */
.panel-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow: hidden;
}

.board-scroll {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.board-idle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

/* ── Category section ── */
.category-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  flex-basis: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  gap: 12px;
}

.category-name {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-badges { display: flex; gap: 6px; align-items: center; }

.waiting-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 100px;
  color: #fff;
  background: rgba(0,0,0,0.25);
  white-space: nowrap;
}

.counters-row {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  grid-auto-rows: 1fr;
  gap: 8px;
  padding: 8px;
  background: var(--color-surface-alt);
  align-content: stretch;
  min-height: 0;
}

.counter-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-top: 3px solid var(--cat-color);
  gap: 4px;
  min-width: 0;
}

.counter-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.counter-idle {
  font-size: 1.5rem;
  color: var(--color-border-dark);
  line-height: 1;
  padding: 4px 0;
}

/* ── Hint overlay ── */
.hint-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 3, 22, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.hint-box {
  background: #fff;
  border-radius: 16px;
  padding: 36px 40px 32px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 24px 64px rgba(4, 3, 22, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.hint-icon {
  font-size: 48px;
  line-height: 1;
}

.hint-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.hint-body {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.hint-body strong {
  color: var(--color-text);
  font-weight: 700;
}

.hint-btn {
  margin-top: 8px;
  padding: 10px 28px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-family);
  letter-spacing: 0.02em;
  transition: opacity 0.15s;
}
.hint-btn:hover { opacity: 0.88; }

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
