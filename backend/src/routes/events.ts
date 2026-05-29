import type { FastifyPluginAsync } from 'fastify'
import { ssePlugin } from '../plugins/sse.js'

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(ssePlugin)
}
