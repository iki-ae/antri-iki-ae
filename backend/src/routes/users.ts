import type { FastifyPluginAsync } from 'fastify'
import { db } from '../config/database.js'
import { users } from '../../drizzle/schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

function hashPassword(p: string) { return crypto.createHash('sha256').update(p).digest('hex') }

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: requireAdmin }, async () => {
    return db.select({ id: users.id, name: users.name, username: users.username, role: users.role, counter_id: users.counter_id, is_active: users.is_active }).from(users).all()
  })

  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as { name: string; username: string; password: string; role: 'admin' | 'operator'; counter_id?: number }
    const result = db.insert(users).values({ ...body, password_hash: hashPassword(body.password) }).returning({ id: users.id, name: users.name, username: users.username, role: users.role }).get()
    return reply.code(201).send(result)
  })

  fastify.put('/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { name?: string; password?: string; role?: 'admin' | 'operator'; counter_id?: number; is_active?: boolean }
    const update: Record<string, unknown> = { ...body }
    if (body.password) { update.password_hash = hashPassword(body.password); delete update.password }
    db.update(users).set(update).where(eq(users.id, Number(id))).run()
    return db.select({ id: users.id, name: users.name, username: users.username, role: users.role, counter_id: users.counter_id }).from(users).where(eq(users.id, Number(id))).get()
  })

  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    if (request.user!.userId === numId) return reply.code(400).send({ error: 'Cannot delete your own account' })
    const adminCount = db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).all().length
    const target = db.select({ role: users.role }).from(users).where(eq(users.id, numId)).get()
    if (target?.role === 'admin' && adminCount <= 1) return reply.code(400).send({ error: 'Cannot delete the last administrator' })
    db.delete(users).where(eq(users.id, numId)).run()
    return reply.code(204).send()
  })
}
