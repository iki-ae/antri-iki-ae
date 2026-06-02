import type { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../middleware/auth.js'
import fs from 'fs'
import Database from 'better-sqlite3'

const DB_PATH = process.env.DB_PATH ?? '/var/www/antri.iki.ae/backend/data/antri-iki-ae.db'
const REQUIRED_TABLES = ['config', 'categories', 'counters', 'users', 'sessions', 'tickets']

export const backupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/export', { preHandler: requireAdmin }, async (_request, reply) => {
    const filename = `antri-iki-ae-backup-${new Date().toISOString().slice(0, 10)}.db`
    const buf = fs.readFileSync(DB_PATH)
    reply.header('Content-Type', 'application/octet-stream')
    reply.header('Content-Disposition', `attachment; filename="${filename}"`)
    return reply.send(buf)
  })

  fastify.post('/import', { preHandler: requireAdmin }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'NO_FILE' })

    const incomingPath = `${DB_PATH}.incoming`

    try {
      const buf = await data.toBuffer()
      fs.writeFileSync(incomingPath, buf)

      // Validate the incoming DB has all required tables
      const incoming = new Database(incomingPath, { readonly: true })
      try {
        const tables = (incoming.prepare(
          "SELECT name FROM sqlite_master WHERE type='table'"
        ).all() as { name: string }[]).map(r => r.name)
        const missing = REQUIRED_TABLES.filter(t => !tables.includes(t))
        if (missing.length > 0) throw new Error(`missing tables: ${missing.join(', ')}`)
      } finally {
        incoming.close()
      }

      // Validation passed — swap atomically
      const timestamp = Date.now()
      if (fs.existsSync(DB_PATH)) fs.renameSync(DB_PATH, `${DB_PATH}.bak.${timestamp}`)
      fs.renameSync(incomingPath, DB_PATH)

      return { ok: true }
    } catch (err: unknown) {
      if (fs.existsSync(incomingPath)) fs.unlinkSync(incomingPath)
      return reply.code(500).send({ error: 'IMPORT_FAILED', detail: String(err) })
    }
  })
}
