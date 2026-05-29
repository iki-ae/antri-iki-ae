import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { counters } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq } from 'drizzle-orm'

export const counterRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return db.select().from(counters).all()
  })

  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as { name: string; category_id: number }
    const result = db.insert(counters).values(body).returning().get()
    return reply.code(201).send(result)
  })

  fastify.put('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<typeof counters.$inferInsert>
    db.update(counters).set(body).where(eq(counters.id, Number(id))).run()
    return db.select().from(counters).where(eq(counters.id, Number(id))).get()
  })

  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    db.update(counters).set({ is_active: false }).where(eq(counters.id, Number(id))).run()
    return reply.code(204).send()
  })
}
