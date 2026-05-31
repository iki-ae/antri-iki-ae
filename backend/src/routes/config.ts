import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { config } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq } from 'drizzle-orm'

export const configRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return db.select().from(config).get() ?? {}
  })

  fastify.put('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as Record<string, string>
    // Strip non-configurable fields — watermark is immutable via API
    delete body.id
    delete body.watermark_text
    db.update(config).set({ ...body, updated_at: new Date().toISOString() }).where(eq(config.id, 1)).run()
    return db.select().from(config).get()
  })
}
