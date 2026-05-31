import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { sessions, tickets, categories } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq, and, inArray, count, sql } from 'drizzle-orm'
import { broadcastQueueState } from '../plugins/sse.js'
import { rebuildQueueState, formatDisplayNumber } from '../services/queueService.js'

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  // All sessions for all active categories, with ticket stats
  fastify.get('/list', async () => {
    const allSessions = db.select().from(sessions).all()
    const allCategories = db.select().from(categories).all()
    const catMap = Object.fromEntries(allCategories.map(c => [c.id, c]))

    return allSessions.map(s => {
      const issued = db.select({ n: count() }).from(tickets)
        .where(eq(tickets.session_id, s.id)).get()?.n ?? 0
      const served = db.select({ n: count() }).from(tickets)
        .where(and(eq(tickets.session_id, s.id), eq(tickets.status, 'done'))).get()?.n ?? 0
      const cat = s.category_id ? catMap[s.category_id] : null
      return { ...s, category: cat ?? null, issued, served }
    })
  })

  // Open sessions (for SSE/operator use)
  fastify.get('/current', async () => {
    return db.select().from(sessions).where(eq(sessions.status, 'open')).all()
  })

  // Create a planned session (no tickets issued yet for kiosk; pre-issued for bulk)
  fastify.post('/create', { preHandler: requireAdmin }, async (request, reply) => {
    const { category_id, mode, bulk_count } = request.body as {
      category_id: number
      mode: 'bulk' | 'kiosk'
      bulk_count?: number
    }

    if (!category_id) return reply.code(400).send({ error: 'CATEGORY_REQUIRED' })

    const cat = db.select().from(categories).where(eq(categories.id, category_id)).get()
    if (!cat) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })

    const today = new Date().toISOString().split('T')[0]
    const session = db.insert(sessions)
      .values({ category_id, date: today, mode, status: 'planned', opened_by: request.user!.userId })
      .returning().get()

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

    return reply.code(201).send(session)
  })

  // Edit a planned session (mode / bulk count)
  fastify.put('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const sessionId = Number(id)
    const { mode, bulk_count } = request.body as { mode?: 'bulk' | 'kiosk'; bulk_count?: number }

    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
    if (!session) return reply.code(404).send({ error: 'SESSION_NOT_FOUND' })
    if (session.status !== 'planned') return reply.code(409).send({ error: 'SESSION_NOT_EDITABLE' })

    const cat = session.category_id
      ? db.select().from(categories).where(eq(categories.id, session.category_id)).get()
      : null
    if (!cat) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })

    const newMode = mode ?? session.mode

    // If mode changed away from bulk, or bulk_count changed: delete existing waiting tickets and re-issue
    if (newMode === 'bulk' && bulk_count !== undefined) {
      db.transaction(() => {
        db.delete(tickets).where(and(
          eq(tickets.session_id, sessionId),
          eq(tickets.status, 'waiting')
        )).run()
        for (let i = 1; i <= bulk_count; i++) {
          db.insert(tickets).values({
            session_id: sessionId,
            category_id: cat.id,
            number: i,
            display_number: formatDisplayNumber(cat.prefix, i),
          }).run()
        }
        db.update(sessions).set({ mode: newMode }).where(eq(sessions.id, sessionId)).run()
      })
    } else if (newMode === 'kiosk') {
      db.transaction(() => {
        db.delete(tickets).where(and(
          eq(tickets.session_id, sessionId),
          eq(tickets.status, 'waiting')
        )).run()
        db.update(sessions).set({ mode: newMode }).where(eq(sessions.id, sessionId)).run()
      })
    }

    return db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
  })

  // Start (planned → open) or resume (closed → open)
  fastify.post('/start', { preHandler: requireAdmin }, async (request, reply) => {
    const { session_id } = request.body as { session_id: number }
    if (!session_id) return reply.code(400).send({ error: 'SESSION_REQUIRED' })

    const session = db.select().from(sessions).where(eq(sessions.id, session_id)).get()
    if (!session) return reply.code(404).send({ error: 'SESSION_NOT_FOUND' })
    if (session.status === 'open') return reply.code(409).send({ error: 'SESSION_ALREADY_OPEN' })

    // Only one open session per category
    if (session.category_id) {
      const existing = db.select().from(sessions)
        .where(and(eq(sessions.status, 'open'), eq(sessions.category_id, session.category_id)))
        .get()
      if (existing) return reply.code(409).send({ error: 'SESSION_ALREADY_OPEN' })
    }

    db.update(sessions)
      .set({ status: 'open', opened_at: new Date().toISOString(), closed_at: null })
      .where(eq(sessions.id, session_id))
      .run()

    await rebuildQueueState()
    broadcastQueueState()
    return db.select().from(sessions).where(eq(sessions.id, session_id)).get()
  })

  // Stop (open → closed) — flushes in-flight tickets
  fastify.post('/stop', { preHandler: requireAdmin }, async (request, reply) => {
    const { session_id } = request.body as { session_id: number }
    if (!session_id) return reply.code(400).send({ error: 'SESSION_REQUIRED' })

    const session = db.select().from(sessions).where(eq(sessions.id, session_id)).get()
    if (!session) return reply.code(404).send({ error: 'SESSION_NOT_FOUND' })
    if (session.status !== 'open') return reply.code(409).send({ error: 'SESSION_NOT_OPEN' })

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

  // Delete a planned or closed session (not open)
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const sessionId = Number(id)

    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
    if (!session) return reply.code(404).send({ error: 'SESSION_NOT_FOUND' })
    if (session.status === 'open') return reply.code(409).send({ error: 'SESSION_IS_OPEN' })

    db.transaction(() => {
      db.delete(tickets).where(eq(tickets.session_id, sessionId)).run()
      db.delete(sessions).where(eq(sessions.id, sessionId)).run()
    })

    return reply.code(204).send()
  })

  // Reset waiting tickets in an open session
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
