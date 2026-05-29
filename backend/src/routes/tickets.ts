import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { callNext, recallTicket, skipTicket, serveTicket, callSkippedTicket } from '../services/queueService.js'
import { broadcastQueueState } from '../plugins/sse.js'

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
}
