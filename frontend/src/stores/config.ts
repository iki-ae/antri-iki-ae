import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configApi } from '@/api'
import { setLocale } from '@/i18n'
import type { Config } from '@/types'

export const useConfigStore = defineStore('config', () => {
  const config = ref<Config | null>(null)

  const institutionName = computed(() => config.value?.institution_name ?? 'Antri-Iki-Ae')
  const watermarkText   = computed(() => config.value?.watermark_text   ?? 'by iki.ae')
  const watermarkUrl    = computed(() => config.value?.watermark_url    ?? 'https://iki.ae')

  async function load() {
    const { data } = await configApi.get()
    config.value = data
    if (data.locale) setLocale(data.locale)
  }

  return { config, institutionName, watermarkText, watermarkUrl, load }
})
