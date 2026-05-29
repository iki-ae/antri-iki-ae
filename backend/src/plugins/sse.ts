import type { FastifyPluginAsync } from 'fastify'
import { getQueueState } from '../services/queueService.js'

// Active SSE connections
const clients = new Set<any>()

export function broadcastQueueState() {
  const state = getQueueState()
  const payload = `data: ${JSON.stringify({ type: 'queue_update', data: state })}\n\n`
  for (const client of clients) {
    try { client.raw.write(payload) } catch { clients.delete(client) }
  }
}

export const ssePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('X-Accel-Buffering', 'no') // disable Nginx buffering
    reply.raw.flushHeaders()

    clients.add(reply)

    // Send current state immediately on connect
    const state = getQueueState()
    reply.raw.write(`data: ${JSON.stringify({ type: 'queue_update', data: state })}\n\n`)

    // Keepalive ping every 25s (prevents proxy timeout)
    const keepalive = setInterval(() => {
      try { reply.raw.write(': ping\n\n') } catch { clearInterval(keepalive) }
    }, 25000)

    request.raw.on('close', () => {
      clients.delete(reply)
      clearInterval(keepalive)
    })

    await new Promise(() => {}) // keep connection open
  })
}
