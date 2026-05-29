<template>
  <ion-page>
    <AdminPageHeader />

    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('operator.settings.title') }}</h2>
        </div>

        <div class="settings-card">
          <!-- Display Name -->
          <div class="settings-row">
            <div class="field">
              <input id="name" v-model="form.name" type="text" placeholder=" " autocomplete="name" />
              <label for="name">{{ $t('operator.settings.name') }}</label>
            </div>
            <button class="save-btn" :disabled="saving" @click="saveName">
              {{ $t('common.save') }}
            </button>
          </div>

          <div class="divider" />

          <!-- Password change -->
          <div class="settings-row">
            <div class="field">
              <input
                id="new-password"
                v-model="form.newPassword"
                :type="showNew ? 'text' : 'password'"
                placeholder=" "
                autocomplete="new-password"
              />
              <label for="new-password">{{ $t('operator.settings.newPassword') }}</label>
              <span class="icon" @click="showNew = !showNew">
                <svg v-if="!showNew" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </span>
            </div>
            <div class="field">
              <input
                id="confirm-password"
                v-model="form.confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                placeholder=" "
                autocomplete="new-password"
              />
              <label for="confirm-password">{{ $t('operator.settings.confirmPassword') }}</label>
              <span class="icon" @click="showConfirm = !showConfirm">
                <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </span>
            </div>
            <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
            <button class="save-btn" :disabled="saving" @click="savePassword">
              {{ $t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { IonPage, IonContent, useIonRouter } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const { t } = useI18n()
const auth  = useAuthStore()
const ionRouter = useIonRouter()

const saving = ref(false)
const showNew     = ref(false)
const showConfirm = ref(false)
const passwordError = ref('')

const form = reactive({
  name:            auth.name,
  newPassword:     '',
  confirmPassword: '',
})

async function saveName() {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const { data } = await usersApi.updateSelf({ name: form.name.trim() })
    auth.name = (data as { name: string }).name
  } finally {
    saving.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  if (!form.newPassword) return
  if (form.newPassword !== form.confirmPassword) {
    passwordError.value = t('operator.settings.passwordMismatch')
    return
  }
  saving.value = true
  try {
    await usersApi.updateSelf({ password: form.newPassword })
    form.newPassword     = ''
    form.confirmPassword = ''
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-body {
  padding: 24px 16px 48px;
  min-height: 100%;
  background: var(--color-surface-alt);
}

.page-body > * {
  max-width: 480px;
}

.settings-card {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.settings-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 16px;
}

.divider {
  height: 1px;
  background: var(--color-border);
}

/* Floating-label input */
.field {
  position: relative;
  width: 100%;
}

.field input {
  width: 100%;
  height: 56px;
  padding: 18px 44px 6px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--color-text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(224, 140, 47, 0.12);
}

.field label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  pointer-events: none;
  transition: top 0.15s, font-size 0.15s, color 0.15s;
}

.field input:focus ~ label,
.field input:not(:placeholder-shown) ~ label {
  top: 10px;
  transform: none;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field .icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  cursor: pointer;
  pointer-events: all;
  display: flex;
  align-items: center;
}

.field-error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  margin: 0;
}

.save-btn {
  align-self: flex-start;
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: background 0.15s;
}

.save-btn:hover {
  background: var(--color-primary-dark);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
