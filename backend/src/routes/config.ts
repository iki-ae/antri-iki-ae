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
    // Protect watermark_text — cannot be removed
    delete body.id
    if (body.watermark_text !== undefined && !body.watermark_text.includes('iki.ae')) {
      return reply.code(400).send({ error: 'WATERMARK_REQUIRED' })
    }
    db.update(config).set({ ...body, updated_at: new Date().toISOString() }).where(eq(config.id, 1)).run()
    return db.select().from(config).get()
  })
}
