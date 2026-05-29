import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'antri_sidebar_open'
const MOBILE_BP   = 900

export const useSidebarStore = defineStore('sidebar', () => {
  const isMobile = ref(window.innerWidth < MOBILE_BP)
  const isOpen   = ref(isMobile.value ? false : localStorage.getItem(STORAGE_KEY) !== '0')

  function toggle() {
    isOpen.value = !isOpen.value
    if (!isMobile.value) localStorage.setItem(STORAGE_KEY, isOpen.value ? '1' : '0')
  }

  function setMobile(mobile: boolean) {
    isMobile.value = mobile
    if (!mobile && !isOpen.value) isOpen.value = true
  }

  return { isOpen, isMobile, toggle, setMobile }
})
