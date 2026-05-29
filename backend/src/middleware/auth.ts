import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'antri-iki-ae-secret-change-in-prod'

export interface JwtPayload {
  userId: number
  role: 'admin' | 'operator'
  counterId?: number
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '9h' })
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies?.token
  if (!token) return reply.code(401).send({ error: 'UNAUTHORIZED' })
  try {
    request.user = jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return reply.code(401).send({ error: 'TOKEN_INVALID' })
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply)
  if (reply.sent) return
  if (request.user?.role !== 'admin') return reply.code(403).send({ error: 'FORBIDDEN' })
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}
