import type { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../middleware/auth.js'
import fs from 'fs'
import archiver from 'archiver'
import unzipper from 'unzipper'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from '../config/database.js'
import { config } from '../../drizzle/schema.js'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../../drizzle/migrations')
const DB_PATH = process.env.DB_PATH ?? '/var/www/antri.iki.ae/backend/data/antri-iki-ae.db'

export const backupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/export', { preHandler: requireAdmin }, async (_request, reply) => {
    const cfg = db.select().from(config).get()
    reply.raw.setHeader('Content-Type', 'application/zip')
    reply.raw.setHeader('Content-Disposition', 'attachment; filename="antri-iki-ae-backup.zip"')

    const archive = archiver('zip')
    archive.pipe(reply.raw)
    archive.append(JSON.stringify(cfg, null, 2), { name: 'config.json' })
    archive.file(DB_PATH, { name: 'antri-iki-ae.db' })
    await archive.finalize()
  })

  fastify.post('/import', { preHandler: requireAdmin }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'NO_FILE' })

    const zipPath = `/tmp/antri-import-${Date.now()}.zip`
    const incomingPath = `${DB_PATH}.incoming`

    await data.toBuffer().then(buf => fs.writeFileSync(zipPath, buf))

    try {
      // Extract zip entries
      const zip = fs.createReadStream(zipPath).pipe(unzipper.Parse({ forceStream: true }))
      let importedDb: Buffer | null = null
      let importedConfig: Record<string, unknown> | null = null

      for await (const entry of zip) {
        const e = entry as unzipper.Entry
        const buf = await e.buffer()
        if (e.path === 'antri-iki-ae.db') importedDb = buf
        else if (e.path === 'config.json') importedConfig = JSON.parse(buf.toString())
      }

      if (!importedDb || !importedConfig) return reply.code(400).send({ error: 'INVALID_BACKUP' })

      // Write to .incoming — live DB not touched yet
      fs.writeFileSync(incomingPath, importedDb)

      // Run migrations on .incoming — validates schema compatibility
      const incomingSqlite = new Database(incomingPath)
      try {
        incomingSqlite.pragma('journal_mode = WAL')
        incomingSqlite.pragma('foreign_keys = ON')
        migrate(drizzle(incomingSqlite), { migrationsFolder: MIGRATIONS_DIR })
      } finally {
        incomingSqlite.close()
      }

      // Migrations passed — swap files atomically
      const timestamp = Date.now()
      if (fs.existsSync(DB_PATH)) {
        fs.renameSync(DB_PATH, `${DB_PATH}.bak.${timestamp}`)
      }
      fs.renameSync(incomingPath, DB_PATH)

      return { ok: true }
    } catch (err: unknown) {
      // Live DB was never touched — just clean up .incoming
      if (fs.existsSync(incomingPath)) fs.unlinkSync(incomingPath)
      return reply.code(500).send({ error: 'IMPORT_FAILED', detail: String(err) })
    } finally {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    }
  })
}
