<template>
  <ion-page>
    <ion-content class="ion-padding" style="--background: var(--ion-color-light);">
      <div class="login-container">
        <div class="login-card">
          <h1>{{ configStore.config?.institution_name ?? 'Antri Iki Ae' }}</h1>
          <p class="subtitle">{{ $t('app.tagline') }}</p>

          <ion-input
            v-model="username"
            :label="$t('auth.username')"
            label-placement="floating"
            fill="outline"
            type="text"
            autocomplete="username"
          />
          <ion-input
            v-model="password"
            :label="$t('auth.password')"
            label-placement="floating"
            fill="outline"
            type="password"
            autocomplete="current-password"
            class="ion-margin-top"
            @keyup.enter="submit"
          />

          <ion-button expand="block" class="ion-margin-top" :disabled="loading" @click="submit">
            <ion-spinner v-if="loading" name="crescent" />
            <span v-else>{{ $t('auth.login') }}</span>
          </ion-button>

          <p v-if="error" class="error-msg">{{ $t('auth.invalidCredentials') }}</p>
        </div>
        <WatermarkFooter />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonInput, IonButton, IonSpinner } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import WatermarkFooter from '@/components/WatermarkFooter.vue'

const router      = useRouter()
const auth        = useAuthStore()
const configStore = useConfigStore()
const username    = ref('')
const password    = ref('')
const loading     = ref(false)
const error       = ref(false)

async function submit() {
  if (!username.value || !password.value) return
  loading.value = true
  error.value   = false
  try {
    const data = await auth.login(username.value, password.value)
    router.replace(data.role === 'admin' ? '/admin' : '/operator')
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container { min-height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem 1rem; }
.login-card { width: 100%; max-width: 380px; background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
.subtitle { color: var(--ion-color-medium); margin: 0 0 1.5rem; font-size: 0.9rem; }
.error-msg { color: var(--ion-color-danger); text-align: center; margin-top: 0.75rem; font-size: 0.9rem; }
</style>
