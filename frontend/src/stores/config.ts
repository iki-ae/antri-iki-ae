import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configApi } from '@/api'
import { setLocale } from '@/i18n'
import type { Config } from '@/types'

const WATERMARK_TEXT = 'by iki.ae'
const WATERMARK_URL  = 'https://iki.ae'

export const useConfigStore = defineStore('config', () => {
  const config = ref<Config | null>(null)

  const institutionName = computed(() => config.value?.institution_name ?? 'antri.iki.ae')
  const watermarkText   = WATERMARK_TEXT
  const watermarkUrl    = WATERMARK_URL

  async function load() {
    const { data } = await configApi.get()
    config.value = data
    if (data.locale) setLocale(data.locale)
  }

  return { config, institutionName, watermarkText, watermarkUrl, load }
})
