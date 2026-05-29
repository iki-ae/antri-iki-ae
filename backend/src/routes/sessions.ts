import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { sessions, tickets, categories } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq, and } from 'drizzle-orm'
import { broadcastQueueState } from '../plugins/sse.js'
import { rebuildQueueState, formatDisplayNumber, nextTicketNumber } from '../services/queueService.js'

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/current', async () => {
    return db.select().from(sessions).where(eq(sessions.status, 'open')).get() ?? null
  })

  fastify.post('/open', { preHandler: requireAdmin }, async (request, reply) => {
    const { mode, bulk } = request.body as {
      mode: 'bulk' | 'kiosk'
      bulk?: { category_id: number; count: number }[]
    }

    const today = new Date().toISOString().split('T')[0]

    let session: typeof sessions.$inferSelect

    try {
      session = db.transaction(() => {
        const existing = db.select().from(sessions).where(eq(sessions.status, 'open')).get()
        if (existing) throw new Error('SESSION_ALREADY_OPEN')
        return db.insert(sessions).values({ date: today, mode, opened_by: request.user!.userId }).returning().get()
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OPEN_FAILED'
      const code = msg === 'SESSION_ALREADY_OPEN' ? 409 : 500
      return reply.code(code).send({ error: msg })
    }

    if (mode === 'bulk' && bulk?.length) {
      for (const { category_id, count } of bulk) {
        const cat = db.select().from(categories).where(eq(categories.id, category_id)).get()
        if (!cat) continue
        for (let i = 1; i <= count; i++) {
          db.insert(tickets).values({
            session_id: session.id,
            category_id,
            number: i,
            display_number: formatDisplayNumber(cat.prefix, i),
          }).run()
        }
      }
    }

    await rebuildQueueState()
    broadcastQueueState()
    return reply.code(201).send(session)
  })

  fastify.post('/close', { preHandler: requireAdmin }, async (_request, reply) => {
    const session = db.select().from(sessions).where(eq(sessions.status, 'open')).get()
    if (!session) return reply.code(404).send({ error: 'NO_ACTIVE_SESSION' })
    db.update(sessions).set({ status: 'closed', closed_at: new Date().toISOString() }).where(eq(sessions.id, session.id)).run()
    await rebuildQueueState()
    broadcastQueueState()
    return { ok: true }
  })

  fastify.post('/reset', { preHandler: requireAdmin }, async (_request, reply) => {
    const session = db.select().from(sessions).where(eq(sessions.status, 'open')).get()
    if (!session) return reply.code(404).send({ error: 'NO_ACTIVE_SESSION' })
    db.delete(tickets).where(and(eq(tickets.session_id, session.id), eq(tickets.status, 'waiting'))).run()
    await rebuildQueueState()
    broadcastQueueState()
    return { ok: true }
  })
}
