import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { sessions, tickets, categories } from '../../drizzle/schema.js'
import { eq, and } from 'drizzle-orm'
import { rebuildQueueState, formatDisplayNumber, nextTicketNumber } from '../services/queueService.js'
import { broadcastQueueState } from '../plugins/sse.js'

export const kioskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/status', async () => {
    const openKioskSessions = db.select().from(sessions)
      .where(and(eq(sessions.status, 'open'), eq(sessions.mode, 'kiosk')))
      .all()

    if (!openKioskSessions.length) return { available: false, categories: [] }

    const openCategoryIds = openKioskSessions
      .map(s => s.category_id)
      .filter((id): id is number => id !== null)

    const availableCategories = db.select().from(categories)
      .where(eq(categories.is_active, true))
      .all()
      .filter(c => openCategoryIds.includes(c.id))

    return { available: true, categories: availableCategories }
  })

  fastify.post('/take', async (request, reply) => {
    const { category_id } = request.body as { category_id: number }

    const session = db.select().from(sessions)
      .where(and(
        eq(sessions.status, 'open'),
        eq(sessions.mode, 'kiosk'),
        eq(sessions.category_id, category_id)
      ))
      .get()
    if (!session) return reply.code(404).send({ error: 'KIOSK_UNAVAILABLE' })

    const cat = db.select().from(categories).where(eq(categories.id, category_id)).get()
    if (!cat || !cat.is_active) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })

    const number = nextTicketNumber(session.id, category_id)
    const display_number = formatDisplayNumber(cat.prefix, number)

    const ticket = db.insert(tickets).values({ session_id: session.id, category_id, number, display_number }).returning().get()

    await rebuildQueueState()
    broadcastQueueState()
    return reply.code(201).send({
      ticket,
      display_number,
      session_title:   session.title,
      category_prefix: cat.prefix,
      category_name:   cat.name,
      created_at:      ticket.created_at,
    })
  })
}
