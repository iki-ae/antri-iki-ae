import { createI18n } from 'vue-i18n'
import id from './locales/id.json'
import en from './locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'en',
  messages: { id, en },
})

export function setLocale(locale: string) {
  i18n.global.locale.value = locale as 'id' | 'en'
  document.documentElement.lang = locale
}
