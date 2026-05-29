import type { FastifyPluginAsync } from 'fastify'
import { getQueueState } from '../services/queueService.js'

export const displayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/state', async () => {
    return getQueueState()
  })
}
