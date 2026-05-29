<template>
  <div class="ticket-number" :class="size === 'sm' ? 'ticket-number--sm' : ''" :style="{ color: color }">
    {{ displayNumber }}
  </div>
</template>

<script setup lang="ts">
defineProps<{ displayNumber: string; color?: string; size?: 'sm' | 'lg' }>()
</script>

<style scoped>
.ticket-number {
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.ticket-number--sm {
  font-size: 1.75rem;
  font-weight: 800;
}
</style>
