<template>
  <div class="ticket-number" :style="{ color: color }">
    {{ displayNumber }}
  </div>
</template>

<script setup lang="ts">
defineProps<{ displayNumber: string; color?: string }>()
</script>

<style scoped>
.ticket-number {
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
</style>
