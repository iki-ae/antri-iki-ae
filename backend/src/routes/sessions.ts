import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { sessions, tickets, categories } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq, and, inArray } from 'drizzle-orm'
import { broadcastQueueState } from '../plugins/sse.js'
import { rebuildQueueState, formatDisplayNumber, nextTicketNumber } from '../services/queueService.js'

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  // Returns all open sessions keyed by category_id
  fastify.get('/current', async () => {
    return db.select().from(sessions).where(eq(sessions.status, 'open')).all()
  })

  fastify.post('/open', { preHandler: requireAdmin }, async (request, reply) => {
    const { category_id, mode, bulk_count } = request.body as {
      category_id: number
      mode: 'bulk' | 'kiosk'
      bulk_count?: number
    }

    if (!category_id) return reply.code(400).send({ error: 'CATEGORY_REQUIRED' })

    const cat = db.select().from(categories).where(eq(categories.id, category_id)).get()
    if (!cat) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })

    const today = new Date().toISOString().split('T')[0]

    let session: typeof sessions.$inferSelect

    try {
      session = db.transaction(() => {
        const existing = db.select().from(sessions)
          .where(and(eq(sessions.status, 'open'), eq(sessions.category_id, category_id)))
          .get()
        if (existing) throw new Error('SESSION_ALREADY_OPEN')
        return db.insert(sessions).values({ category_id, date: today, mode, opened_by: request.user!.userId }).returning().get()
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OPEN_FAILED'
      const code = msg === 'SESSION_ALREADY_OPEN' ? 409 : 500
      return reply.code(code).send({ error: msg })
    }

    if (mode === 'bulk' && bulk_count && bulk_count > 0) {
      for (let i = 1; i <= bulk_count; i++) {
        db.insert(tickets).values({
          session_id: session.id,
          category_id,
          number: i,
          display_number: formatDisplayNumber(cat.prefix, i),
        }).run()
      }
    }

    await rebuildQueueState()
    broadcastQueueState()
    return reply.code(201).send(session)
  })

  fastify.post('/close', { preHandler: requireAdmin }, async (request, reply) => {
    const { category_id } = request.body as { category_id: number }
    if (!category_id) return reply.code(400).send({ error: 'CATEGORY_REQUIRED' })

    const session = db.select().from(sessions)
      .where(and(eq(sessions.status, 'open'), eq(sessions.category_id, category_id)))
      .get()
    if (!session) return reply.code(404).send({ error: 'NO_ACTIVE_SESSION' })

    const now = new Date().toISOString()
    db.transaction(() => {
      db.update(tickets)
        .set({ status: 'done', served_at: now })
        .where(and(
          eq(tickets.session_id, session.id),
          inArray(tickets.status, ['called', 'recalled', 'serving'])
        ))
        .run()
      db.update(sessions).set({ status: 'closed', closed_at: now }).where(eq(sessions.id, session.id)).run()
    })

    await rebuildQueueState()
    broadcastQueueState()
    return { ok: true }
  })

  fastify.post('/reset', { preHandler: requireAdmin }, async (request, reply) => {
    const { category_id } = request.body as { category_id: number }
    if (!category_id) return reply.code(400).send({ error: 'CATEGORY_REQUIRED' })

    const session = db.select().from(sessions)
      .where(and(eq(sessions.status, 'open'), eq(sessions.category_id, category_id)))
      .get()
    if (!session) return reply.code(404).send({ error: 'NO_ACTIVE_SESSION' })

    db.delete(tickets).where(and(eq(tickets.session_id, session.id), eq(tickets.status, 'waiting'))).run()
    await rebuildQueueState()
    broadcastQueueState()
    return { ok: true }
  })
}
