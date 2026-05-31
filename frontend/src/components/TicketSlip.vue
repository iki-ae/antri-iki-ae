<template>
  <div class="ticket-slip">
    <div class="slip-header">
      <div class="slip-institution">{{ institutionName }}</div>
      <div class="slip-session">{{ sessionTitle }}</div>
      <div class="slip-category">{{ categoryPrefix }} — {{ categoryName }}</div>
    </div>
    <div class="slip-divider"></div>
    <div class="slip-number">{{ displayNumber }}</div>
    <div class="slip-divider"></div>
    <div class="slip-issued">{{ formattedDate }}</div>
    <div class="slip-divider"></div>
    <div class="slip-watermark">powered by iki.ae</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  institutionName: string
  sessionTitle: string
  categoryPrefix: string
  categoryName: string
  displayNumber: string
  issuedAt: string
}>()

const formattedDate = computed(() => {
  const d = new Date(props.issuedAt)
  if (isNaN(d.getTime())) return props.issuedAt
  const date = d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
})
</script>

<style scoped>
.ticket-slip {
  width: 80mm;
  padding: 6mm 5mm;
  font-family: 'Courier New', Courier, monospace;
  color: #000;
  background: #fff;
  box-sizing: border-box;
  border: none;
}

.slip-header {
  text-align: center;
  margin-bottom: 2mm;
}

.slip-institution {
  font-size: 11pt;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.slip-session {
  font-size: 9pt;
  margin-top: 1mm;
}

.slip-category {
  font-size: 9pt;
  margin-top: 0.5mm;
}

.slip-divider {
  border-top: 1px dashed #000;
  margin: 2mm 0;
}

.slip-number {
  text-align: center;
  font-size: 36pt;
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1.1;
  padding: 2mm 0;
}

.slip-issued {
  text-align: center;
  font-size: 9pt;
}

.slip-watermark {
  text-align: center;
  font-size: 8pt;
  color: #555;
  margin-top: 1mm;
}
</style>
