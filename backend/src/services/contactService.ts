import { db } from '../config/database.js'
import { config } from '../../drizzle/schema.js'

const CONTACT_ENDPOINT = 'https://antri.iki.ae/api/statistics_collection'

export async function sendContactIfConsented(): Promise<void> {
  try {
    const row = db.select().from(config).get()
    if (!row?.contact_consent_storage) return

    const payload = {
      name:             row.contact_name      ?? '',
      org:              row.contact_org       ?? '',
      email:            row.contact_email     ?? '',
      whatsapp:         row.contact_whatsapp  ?? '',
      consent_list:     row.contact_consent_list     ? 1 : 0,
      consent_updates:  row.contact_consent_updates  ? 1 : 0,
      app_version:      row.app_version,
      institution_name: row.institution_name,
    }

    await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    // Intentionally swallowed — contact submission is best-effort, never blocks startup
  }
}
