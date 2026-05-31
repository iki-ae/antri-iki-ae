import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { categories, sessions, tickets } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { broadcastQueueState } from '../plugins/sse.js'
import { eq, asc, and } from 'drizzle-orm'

export const categoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return db.select().from(categories).orderBy(asc(categories.sort_order)).all()
  })

  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as { prefix: string; name: string; color?: string; sort_order?: number }
    const result = db.insert(categories).values(body).returning().get()
    return reply.code(201).send(result)
  })

  fastify.put('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    const body = request.body as Partial<typeof categories.$inferInsert>

    if (body.prefix !== undefined) {
      const current = db.select().from(categories).where(eq(categories.id, numId)).get()
      if (current && body.prefix !== current.prefix) {
        const openSession = db.select().from(sessions)
          .where(and(eq(sessions.status, 'open'), eq(sessions.category_id, numId)))
          .get()
        if (openSession) {
          const hasTickets = db
            .select({ id: tickets.id })
            .from(tickets)
            .where(and(eq(tickets.session_id, openSession.id), eq(tickets.category_id, numId)))
            .get()
          if (hasTickets) return reply.code(409).send({ error: 'PREFIX_LOCKED' })
        }
      }
    }

    db.update(categories).set(body).where(eq(categories.id, numId)).run()
    broadcastQueueState()
    return db.select().from(categories).where(eq(categories.id, numId)).get()
  })

  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    db.update(categories).set({ is_active: false }).where(eq(categories.id, Number(id))).run()
    return reply.code(204).send()
  })
}
