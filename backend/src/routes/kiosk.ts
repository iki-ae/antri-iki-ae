import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { sessions, tickets, categories } from '../../drizzle/schema.js'
import { eq } from 'drizzle-orm'
import { rebuildQueueState, formatDisplayNumber, nextTicketNumber } from '../services/queueService.js'
import { broadcastQueueState } from '../plugins/sse.js'

export const kioskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/status', async () => {
    const session = db.select().from(sessions).where(eq(sessions.status, 'open')).get()
    if (!session || session.mode !== 'kiosk') return { available: false }
    const cats = db.select().from(categories).where(eq(categories.is_active, true)).all()
    return { available: true, categories: cats }
  })

  fastify.post('/take', async (request, reply) => {
    const session = db.select().from(sessions).where(eq(sessions.status, 'open')).get()
    if (!session || session.mode !== 'kiosk') return reply.code(404).send({ error: 'KIOSK_UNAVAILABLE' })

    const { category_id } = request.body as { category_id: number }
    const cat = db.select().from(categories).where(eq(categories.id, category_id)).get()
    if (!cat || !cat.is_active) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })

    const number = nextTicketNumber(session.id, category_id)
    const display_number = formatDisplayNumber(cat.prefix, number)

    const ticket = db.insert(tickets).values({ session_id: session.id, category_id, number, display_number }).returning().get()

    await rebuildQueueState()
    broadcastQueueState()
    return reply.code(201).send({ ticket, display_number })
  })
}
