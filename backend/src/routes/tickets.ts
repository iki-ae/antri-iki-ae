import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { callNext, recallTicket, skipTicket, serveTicket } from '../services/queueService.js'
import { broadcastQueueState } from '../plugins/sse.js'

export const ticketRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/call', { preHandler: requireAuth }, async (request, reply) => {
    const { counter_id } = request.body as { counter_id: number }
    const result = callNext(counter_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/recall', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const result = recallTicket(ticket_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/skip', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const result = skipTicket(ticket_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })

  fastify.post('/serve', { preHandler: requireAuth }, async (request, reply) => {
    const { ticket_id } = request.body as { ticket_id: number }
    const result = serveTicket(ticket_id)
    if ('error' in result) return reply.code(400).send(result)
    broadcastQueueState()
    return result
  })
}
