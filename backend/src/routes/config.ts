import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { config } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq } from 'drizzle-orm'

const IMMUTABLE_FIELDS = ['id', 'watermark_text', 'app_version', 'terms_accepted_at']

export const configRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return db.select().from(config).get() ?? {}
  })

  fastify.put('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as Record<string, unknown>
    for (const field of IMMUTABLE_FIELDS) delete body[field]
    db.update(config).set({ ...body, updated_at: new Date().toISOString() }).where(eq(config.id, 1)).run()
    return db.select().from(config).get()
  })

  // One-shot endpoint: records terms acceptance timestamp (UTC ISO string).
  // terms_accepted_at is immutable via the main PUT — must use this endpoint.
  fastify.post('/terms-accept', { preHandler: requireAdmin }, async (request, reply) => {
    const existing = db.select().from(config).get()
    if (existing?.terms_accepted_at) {
      // Already accepted — return current config without overwriting
      return existing
    }
    const now = new Date().toISOString()
    db.update(config).set({ terms_accepted_at: now, updated_at: now }).where(eq(config.id, 1)).run()
    return db.select().from(config).get()
  })
}
