<template>
  <ion-page>
    <ion-content>
      <div class="login-container">
        <div class="card">

          <div class="header">
            <div class="brand"><span>antri.</span>iki.ae</div>
            <div class="tagline">{{ $t('app.tagline') }}</div>
          </div>

          <div class="body">
            <div class="fields">

              <div class="field">
                <input
                  v-model="username"
                  id="username"
                  type="text"
                  placeholder=" "
                  autocomplete="username"
                  @keyup.enter="submit"
                />
                <label for="username">{{ $t('auth.username') }}</label>
                <span class="icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
              </div>

              <div class="field">
                <input
                  v-model="password"
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder=" "
                  autocomplete="current-password"
                  @keyup.enter="submit"
                />
                <label for="password">{{ $t('auth.password') }}</label>
                <span class="icon toggle-pw" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </span>
              </div>

            </div>

            <button class="btn" :disabled="loading" @click="submit">
              <ion-spinner v-if="loading" name="crescent" style="width:20px;height:20px;" />
              <span v-else>{{ $t('auth.login') }}</span>
            </button>

            <p v-if="error" class="error-msg">{{ $t('auth.invalidCredentials') }}</p>
          </div>

          <a class="footer" :href="configStore.watermarkUrl" target="_blank" rel="noopener">
            <div class="footer-text">
              powered by
              <strong>iki.ae</strong>
            </div>
            <div class="qr">
              <img src="@/assets/qr-iki-ae.svg" alt="iki.ae" width="28" height="28" />
            </div>
          </a>

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

const router       = useRouter()
const auth         = useAuthStore()
const configStore  = useConfigStore()
const username     = ref('')
const password     = ref('')
const loading      = ref(false)
const error        = ref(false)
const showPassword = ref(false)

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
/* ── Page ── */
ion-content {
  --background: var(--color-background);
  --background-image:
    radial-gradient(ellipse 60% 50% at 20% 20%, rgba(224,140,47,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 80%, rgba(54,124,111,0.07) 0%, transparent 70%);
}

.login-container {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-image:
    radial-gradient(ellipse 60% 50% at 20% 20%, rgba(224,140,47,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 80%, rgba(54,124,111,0.07) 0%, transparent 70%);
}

/* ── Card ── */
.card {
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(4,3,22,0.10), 0 4px 16px rgba(4,3,22,0.06);
  width: 100%;
  max-width: 380px;
  overflow: hidden;
  animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes rise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ── */
.header {
  background: var(--color-accent);
  padding: 28px 32px 24px;
  position: relative;
  overflow: hidden;
}
.header::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 120px; height: 120px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
}
.header::after {
  content: '';
  position: absolute;
  bottom: -20px; left: 20px;
  width: 70px; height: 70px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}

.brand {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
  position: relative;
  z-index: 1;
}
.brand span {
  opacity: 0.75;
  font-weight: 500;
}
.tagline {
  font-size: 12.5px;
  color: rgba(255,255,255,0.70);
  margin-top: 4px;
  font-weight: 400;
  position: relative;
  z-index: 1;
  letter-spacing: 0.2px;
}

/* ── Body ── */
.body {
  padding: 32px 32px 28px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Floating label fields ── */
.field {
  position: relative;
}
.field input {
  width: 100%;
  height: 56px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px 44px 6px 16px;
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;
}
.field input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(224,140,47,0.12);
}
.field label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14.5px;
  font-weight: 400;
  color: var(--color-text-muted);
  pointer-events: none;
  transition: top 0.18s ease, font-size 0.18s ease, color 0.18s ease, font-weight 0.18s ease;
}
.field input:focus ~ label,
.field input:not(:placeholder-shown) ~ label {
  top: 10px;
  transform: translateY(0);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-accent);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.field .icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  pointer-events: none;
}
.field .toggle-pw {
  pointer-events: all;
  cursor: pointer;
  transition: color 0.15s;
}
.field .toggle-pw:hover {
  color: var(--color-accent);
}

/* ── Button ── */
.btn {
  margin-top: 24px;
  width: 100%;
  height: 52px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
  box-shadow: 0 4px 14px rgba(224,140,47,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn:hover:not(:disabled) {
  background: var(--color-accent-dark);
  box-shadow: 0 6px 20px rgba(224,140,47,0.45);
  transform: translateY(-1px);
}
.btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}
.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: var(--color-danger);
  text-align: center;
  margin-top: 12px;
  font-size: var(--font-size-sm);
}

/* ── Footer ── */
.footer {
  background: var(--color-secondary);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
}
.footer:hover {
  background: var(--color-secondary-dark);
}

.footer-text {
  font-size: 11px;
  color: rgba(255,255,255,0.65);
  text-align: right;
  line-height: 1.4;
}
.footer-text strong {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.95);
  font-weight: 600;
}

.qr {
  width: 38px;
  height: 38px;
  background: #fff;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.qr img {
  width: 34px;
  height: 34px;
  display: block;
}
</style>
