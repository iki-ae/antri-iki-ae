import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'

/* Brand theme */
import './theme/variables.css'

/* Ionic core CSS */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

const app = createApp(App)
const pinia = createPinia()
app.use(IonicVue)
app.use(pinia)
app.use(router)
app.use(i18n)

// Bootstrap: restore session + load config before router guard fires
const authStore   = useAuthStore()
const configStore = useConfigStore()

Promise.allSettled([authStore.restore(), configStore.load()])
  .then(() => router.isReady())
  .then(() => app.mount('#app'))
