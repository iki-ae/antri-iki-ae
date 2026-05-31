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

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  form.value = { ...data }
}

async function saveField(field: keyof Config) {
  if (!form.value) return
  await configApi.update({ [field]: form.value[field] })
  await configStore.load()
  const toast = await toastController.create({
    message: t('common.success'),
    duration: 1500,
    position: 'bottom',
    color: 'success',
  })
  await toast.present()
}

async function onLocaleChange() {
  if (!form.value) return
  await configApi.update({ locale: form.value.locale })
  await configStore.load()
  window.location.reload()
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
</style>
