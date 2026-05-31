<template>
  <div :class="['watermark-footer', variant]">
    <a href="https://iki.ae" target="_blank" rel="noopener">by iki.ae</a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'display' | 'subtle'  // display = large white, subtle = small muted
}>()
</script>

<style scoped>
.watermark-footer {
  text-align: center;
  user-select: none;
}
.watermark-footer a {
  text-decoration: none;
  font-weight: 500;
}

/* Display variant — visible from 3 meters on TV */
.watermark-footer.display {
  padding: 12px 0 16px;
  font-size: 18px;
  letter-spacing: 0.03em;
}
.watermark-footer.display a {
  color: rgba(255, 255, 255, 0.7);
}
.watermark-footer.display a:hover {
  color: rgba(255, 255, 255, 0.95);
}

/* Subtle variant — admin/operator footer */
.watermark-footer.subtle {
  padding: 8px 0 12px;
  font-size: 11px;
}
.watermark-footer.subtle a {
  color: var(--ion-color-medium);
}
</style>
