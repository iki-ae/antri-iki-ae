<template>
  <div class="terms-overlay">
    <div class="terms-dialog">
      <div class="terms-header">
        <div class="terms-brand">
          IKI Antri
          <a href="https://antri.iki.ae" target="_blank" rel="noopener" class="terms-brand-url">(https://antri.iki.ae)</a>
        </div>
        <h2 class="terms-title">{{ $t('config.terms.modalTitle') }}</h2>
      </div>
      <div class="terms-body">
        <p class="terms-text">{{ $t('config.terms.body') }}</p>
        <a
          class="license-link"
          href="https://mariadb.com/bsl11/"
          target="_blank"
          rel="noopener"
        >{{ $t('config.terms.viewLicense') }}</a>
      </div>
      <div class="terms-footer">
        <button class="agree-btn" :disabled="busy" @click="accept">
          {{ $t('config.terms.agree') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { configApi } from '@/api'
import { useConfigStore } from '@/stores/config'

const busy = ref(false)
const configStore = useConfigStore()

async function accept() {
  busy.value = true
  try {
    const { data } = await configApi.termsAccept()
    configStore.config = data
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.terms-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 10, 26, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.terms-dialog {
  background: var(--color-surface);
  border-radius: 14px;
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.28);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.terms-header {
  background: var(--color-accent);
  padding: 20px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.terms-brand {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.90);
  letter-spacing: 0.3px;
}

.terms-brand-url {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 0.15s;
}

.terms-brand-url:hover {
  color: rgba(255,255,255,0.95);
}

.terms-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.terms-body {
  padding: 24px;
  flex: 1;
}

.terms-text {
  margin: 0 0 14px;
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: 1.65;
}

.license-link {
  display: inline-block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  transition: text-decoration 0.15s;
}

.license-link:hover {
  text-decoration: underline;
}

.terms-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
}

.agree-btn {
  height: 48px;
  padding: 0 32px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: var(--font-size-base);
  font-weight: 700;
  font-family: var(--font-family);
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.agree-btn:hover {
  background: var(--color-accent-dark, #c8730f);
}

.agree-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
