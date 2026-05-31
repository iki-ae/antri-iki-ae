import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../drizzle/schema.js'
import path from 'path'
import crypto from 'crypto'

const DB_PATH = process.env.DB_PATH ?? path.resolve('/var/www/antri.iki.ae/backend/data/antri-iki-ae.db')

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// ─── Seed: ensure config row and default admin exist ─────────────────────────
function seed() {
  const raw = sqlite as InstanceType<typeof Database>

  const configRow = (raw.prepare('SELECT id FROM config WHERE id = 1').get() as { id: number } | undefined)
  if (!configRow) {
    raw.prepare(`
      INSERT INTO config (id, institution_name, locale, app_version, watermark_text)
      VALUES (1, 'antri.iki.ae', 'id', '1.0.0', 'by iki.ae')
    `).run()
  }

  // Integrity check — enforce watermark on every boot regardless of DB state
  raw.prepare(`UPDATE config SET watermark_text = 'by iki.ae' WHERE id = 1`).run()

  const adminRow = (raw.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as { id: number } | undefined)
  if (!adminRow) {
    const hash = crypto.createHash('sha256').update('admin123').digest('hex')
    raw.prepare(`
      INSERT INTO users (name, username, password_hash, role, is_active)
      VALUES ('Administrator', 'admin', ?, 'admin', 1)
    `).run(hash)
  }
}

try {
  seed()
} catch {
  // Tables may not exist yet (pre-migration); seed will be called again on next start
}
