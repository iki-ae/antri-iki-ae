import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { callNext, recallTicket, skipTicket, serveTicket, callSkippedTicket } from '../services/queueService.js'
import { broadcastQueueState } from '../plugins/sse.js'
import { db } from '../config/database.js'
import { tickets, sessions, categories } from '../../drizzle/schema.js'
import { eq, and, gte, lte } from 'drizzle-orm'

export const ticketRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/call', { preHandler: requireAuth }, async (request, reply) => {
    const { counter_id } = request.body as { counter_id: number }
    const result = await callNext(counter_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/recall', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const result = await recallTicket(ticket_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/skip', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const result = await skipTicket(ticket_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/serve', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const result = await serveTicket(ticket_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/call-skipped', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const counter_id = request.user!.counterId
    if (!counter_id) return reply.code(400).send({ error: 'COUNTER_NOT_ASSIGNED' })
    const result = await callSkippedTicket(ticket_id, counter_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.get('/by-session/:sessionId', { preHandler: requireAuth }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    const { from, to } = request.query as { from?: string; to?: string }
    const sid = parseInt(sessionId, 10)
    if (isNaN(sid)) return reply.code(400).send({ error: 'INVALID_SESSION_ID' })

    const session = db.select().from(sessions).where(eq(sessions.id, sid)).get()
    if (!session) return reply.code(404).send({ error: 'SESSION_NOT_FOUND' })

    const cat = session.category_id
      ? db.select().from(categories).where(eq(categories.id, session.category_id)).get()
      : null

    const fromNum = from !== undefined ? parseInt(from, 10) : undefined
    const toNum   = to   !== undefined ? parseInt(to,   10) : undefined

    const conditions = [eq(tickets.session_id, sid)]
    if (fromNum !== undefined && toNum !== undefined) {
      conditions.push(gte(tickets.number, fromNum))
      conditions.push(lte(tickets.number, toNum))
    } else if (fromNum !== undefined) {
      conditions.push(eq(tickets.number, fromNum))
    }

    const rows = db.select().from(tickets)
      .where(and(...conditions))
      .orderBy(tickets.number)
      .all()

    return rows.map(t => ({
      display_number:  t.display_number,
      number:          t.number,
      created_at:      t.created_at,
      session_title:   session.title,
      category_prefix: cat?.prefix ?? '',
      category_name:   cat?.name ?? '',
    }))
  })
}
