<template>
  <ion-page>
    <AdminPageHeader />
    <ion-content>
      <div class="page-body">
        <div class="card-header">
          <h2 class="card-title">{{ $t('admin.nav.config') }}</h2>
        </div>
        <div class="settings-card" v-if="form">

          <!-- Institution Name -->
          <section class="settings-section">
            <div class="field-row">
              <div class="field">
                <input
                  id="institution_name"
                  type="text"
                  v-model="form.institution_name"
                  placeholder=" "
                  @keydown.enter="saveField('institution_name')"
                />
                <label for="institution_name">{{ $t('config.institutionName') }}</label>
              </div>
              <button class="save-btn" @click="saveField('institution_name')">{{ $t('common.save') }}</button>
            </div>
          </section>

          <!-- Language -->
          <section class="settings-section">
            <div class="field">
              <select id="locale" v-model="form.locale" @change="onLocaleChange">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
              <label for="locale">{{ $t('config.locale') }}</label>
              <span class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>
          </section>

          <!-- Timezone -->
          <section class="settings-section">
            <div class="field">
              <select id="timezone" v-model="form.timezone" @change="saveField('timezone')">
                <option value="Asia/Jakarta">WIB — Waktu Indonesia Barat (UTC+7)</option>
                <option value="Asia/Makassar">WITA — Waktu Indonesia Tengah (UTC+8)</option>
                <option value="Asia/Jayapura">WIT — Waktu Indonesia Timur (UTC+9)</option>
                <option value="UTC">UTC</option>
              </select>
              <label for="timezone">{{ $t('config.timezone') }}</label>
              <span class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>
          </section>

          <!-- ── Contact ─────────────────────────────────────────────── -->
          <section class="settings-section">
            <h3 class="section-heading">{{ $t('config.contact.sectionTitle') }}</h3>

            <div class="field" style="margin-bottom: 14px;">
              <input id="contact_name" type="text" v-model="form.contact_name" placeholder=" " />
              <label for="contact_name">{{ $t('config.contact.name') }}</label>
            </div>

            <div class="field" style="margin-bottom: 14px;">
              <input id="contact_org" type="text" v-model="form.contact_org" placeholder=" " />
              <label for="contact_org">{{ $t('config.contact.org') }}</label>
            </div>

            <div class="field" style="margin-bottom: 14px;">
              <input id="contact_email" type="email" v-model="form.contact_email" placeholder=" " />
              <label for="contact_email">{{ $t('config.contact.email') }}</label>
            </div>

            <div class="field" style="margin-bottom: 20px;">
              <input id="contact_whatsapp" type="tel" v-model="form.contact_whatsapp" placeholder=" " />
              <label for="contact_whatsapp">{{ $t('config.contact.whatsapp') }}</label>
            </div>

            <p class="consent-lead">{{ $t('config.contact.leadText') }}</p>

            <label class="checkbox-row">
              <input type="checkbox" v-model="form.contact_consent_list" />
              <span>{{ $t('config.contact.consentList') }}</span>
            </label>

            <label class="checkbox-row">
              <input type="checkbox" v-model="form.contact_consent_updates" />
              <span>{{ $t('config.contact.consentUpdates') }}</span>
            </label>

            <label class="checkbox-row" style="margin-bottom: 20px;">
              <input type="checkbox" v-model="form.contact_consent_storage" />
              <span>{{ $t('config.contact.consentStorage') }}</span>
            </label>

            <button class="save-btn" @click="saveContact">{{ $t('common.save') }}</button>
          </section>

          <!-- ── Terms of Use ────────────────────────────────────────── -->
          <section class="settings-section">
            <h3 class="section-heading">{{ $t('config.terms.sectionTitle') }}</h3>
            <p class="terms-text">{{ $t('config.terms.body') }}</p>
            <a
              class="license-link"
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener"
            >{{ $t('config.terms.viewLicense') }}</a>
            <p v-if="termsStamp" class="terms-stamp">
              {{ $t('config.terms.acceptedAt') }}: <strong>{{ termsStamp }}</strong>
            </p>
            <p v-else class="terms-stamp terms-stamp--none">
              {{ $t('config.terms.notAccepted') }}
            </p>
          </section>

        </div>

        <!-- ── About strip ───────────────────────────────────────────── -->
        <div class="about-strip">
          <span class="about-version">IKI Antri v{{ form?.app_version ?? '—' }} &nbsp;·&nbsp; &copy; 2024 iki.ae</span>
          <span class="about-support">
            {{ $t('config.about.support') }} —
            <a href="https://support.iki.ae" target="_blank" rel="noopener">support.iki.ae</a>
          </span>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IonPage, IonContent, onIonViewWillEnter, toastController } from '@ionic/vue'
import AdminPageHeader from '@/components/AdminPageHeader.vue'
import { useI18n } from 'vue-i18n'
import { configApi } from '@/api'
import { useConfigStore } from '@/stores/config'
import type { Config } from '@/types'

const { t } = useI18n()
const configStore = useConfigStore()
const form = ref<Partial<Config> | null>(null)

onIonViewWillEnter(load)

async function load() {
  const { data } = await configApi.get()
  if (!data.institution_name) data.institution_name = 'antri.iki.ae'
  if (!data.timezone) data.timezone = 'Asia/Jakarta'
  form.value = { ...data }
}

async function saveField(field: keyof Config) {
  if (!form.value) return
  await configApi.update({ [field]: form.value[field] })
  await configStore.load()
  showSuccess()
}

async function onLocaleChange() {
  if (!form.value) return
  await configApi.update({ locale: form.value.locale })
  await configStore.load()
  window.location.reload()
}

async function saveContact() {
  if (!form.value) return
  await configApi.update({
    contact_name:            form.value.contact_name,
    contact_org:             form.value.contact_org,
    contact_email:           form.value.contact_email,
    contact_whatsapp:        form.value.contact_whatsapp,
    contact_consent_list:    form.value.contact_consent_list,
    contact_consent_updates: form.value.contact_consent_updates,
    contact_consent_storage: form.value.contact_consent_storage,
  })
  await configStore.load()
  showSuccess()
}

const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Jakarta':   'WIB',
  'Asia/Makassar':  'WITA',
  'Asia/Jayapura':  'WIT',
  'UTC':            'UTC',
}

const termsStamp = computed(() => {
  const at = configStore.termsAcceptedAt
  if (!at) return null
  const tz = configStore.timezone
  const label = TIMEZONE_LABELS[tz] ?? tz
  const d = new Date(at)
  const formatted = d.toLocaleString('id-ID', {
    timeZone: tz,
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  return `${formatted} ${label}`
})

async function showSuccess() {
  const toast = await toastController.create({
    message: t('common.success'),
    duration: 1500,
    position: 'bottom',
    color: 'success',
  })
  await toast.present()
}
</script>

<style scoped>
.page-body {
  padding: 24px 16px 48px;
  min-height: 100%;
  background: var(--color-surface-alt);
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

.settings-section {
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.settings-section:last-child {
  border-bottom: none;
}

.section-heading {
  margin: 0 0 16px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

/* field-row: input + save button side by side */
.field-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.field-row .field {
  flex: 1;
}

/* ---- Floating label input ---- */
.field {
  position: relative;
}

.field input,
.field select {
  width: 100%;
  height: 56px;
  padding: 18px 44px 6px 16px;
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: none;
  -webkit-appearance: none;
}

.field select {
  cursor: pointer;
}

.field input:focus,
.field select:focus {
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
  transition: top 0.15s, font-size 0.15s, color 0.15s, font-weight 0.15s;
}

.field input:focus ~ label,
.field input:not(:placeholder-shown) ~ label {
  top: 10px;
  transform: none;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
}

/* select always has a value — label always floated */
.field select ~ label {
  top: 10px;
  transform: none;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
}

.field .icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  display: flex;
  align-items: center;
}

/* ---- Consent checkboxes ---- */
.consent-lead {
  margin: 0 0 12px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-style: italic;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}

.checkbox-row input[type="checkbox"] {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.checkbox-row span {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.5;
}

/* ---- License link ---- */
.license-link {
  display: inline-block;
  margin-bottom: 14px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}

.license-link:hover {
  text-decoration: underline;
}

/* ---- Terms stamp ---- */
.terms-text {
  margin: 0 0 14px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.65;
}

.terms-stamp {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.terms-stamp strong {
  color: var(--color-text);
}

.terms-stamp--none {
  font-style: italic;
}

/* ---- Save button ---- */
.save-btn {
  height: 56px;
  padding: 0 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}

.save-btn:hover {
  background: var(--color-primary-dark);
}

/* ---- About strip ---- */
.about-strip {
  width: 100%;
  max-width: 480px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
}

.about-version {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.about-support {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.about-support a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.about-support a:hover {
  text-decoration: underline;
}
</style>
