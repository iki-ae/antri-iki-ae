import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { users } from '../../drizzle/schema.js'
import { eq } from 'drizzle-orm'
import { signToken, requireAuth } from '../middleware/auth.js'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }
    const user = db.select().from(users).where(eq(users.username, username)).get()
    if (!user || !user.is_active) return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    if (user.password_hash !== hashPassword(password)) return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })

    const token = signToken({ userId: user.id, role: user.role, counterId: user.counter_id ?? undefined })
    reply.setCookie('token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
    return { role: user.role, name: user.name, counterId: user.counter_id }
  })

  fastify.post('/logout', { preHandler: requireAuth }, async (_request, reply) => {
    reply.clearCookie('token', { path: '/' })
    return { ok: true }
  })

  fastify.get('/me', { preHandler: requireAuth }, async (request) => {
    const user = db.select().from(users).where(eq(users.id, request.user!.userId)).get()
    if (!user) return { error: 'NOT_FOUND' }
    return { id: user.id, name: user.name, role: user.role, counterId: user.counter_id }
  })
}
