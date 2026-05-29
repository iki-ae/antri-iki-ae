<template>
  <div
    class="ticket-number"
    :class="{
      'ticket-number--sm': size === 'sm',
      'ticket-number--md': size === 'md',
    }"
    :style="{ color: color }"
  >
    {{ displayNumber }}
  </div>
</template>

<script setup lang="ts">
defineProps<{ displayNumber: string; color?: string; size?: 'sm' | 'md' | 'lg' }>()
</script>

<style scoped>
.ticket-number {
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.ticket-number--md {
  font-size: clamp(1.4rem, 4vh, 3.2rem);
  font-weight: 900;
}

.ticket-number--sm {
  font-size: 1.75rem;
  font-weight: 800;
}
</style>
