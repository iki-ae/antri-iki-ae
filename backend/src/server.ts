import path from 'path'
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'

import { rebuildQueueState } from './services/queueService.js'
import { sendContactIfConsented } from './services/contactService.js'
import { authRoutes }       from './routes/auth.js'
import { configRoutes }     from './routes/config.js'
import { categoryRoutes }   from './routes/categories.js'
import { counterRoutes }      from './routes/counters.js'
import { userRoutes }       from './routes/users.js'
import { sessionRoutes }    from './routes/sessions.js'
import { ticketRoutes }     from './routes/tickets.js'
import { kioskRoutes }      from './routes/kiosk.js'
import { displayRoutes }    from './routes/display.js'
import { eventsRoutes }     from './routes/events.js'
import { backupRoutes }     from './routes/backup.js'

const app = Fastify({ logger: true })

await app.register(fastifyCors, {
  origin: true,
  credentials: true,
})
await app.register(fastifyCookie)
await app.register(fastifyMultipart, { limits: { fileSize: 100 * 1024 * 1024 } })

// Routes
await app.register(authRoutes,     { prefix: '/api/auth' })
await app.register(configRoutes,   { prefix: '/api/config' })
await app.register(categoryRoutes, { prefix: '/api/categories' })
await app.register(counterRoutes,    { prefix: '/api/counters' })
await app.register(userRoutes,     { prefix: '/api/users' })
await app.register(sessionRoutes,  { prefix: '/api/sessions' })
await app.register(ticketRoutes,   { prefix: '/api/tickets' })
await app.register(kioskRoutes,    { prefix: '/api/kiosk' })
await app.register(displayRoutes,  { prefix: '/api/display' })
await app.register(eventsRoutes,   { prefix: '/api/events' })
await app.register(backupRoutes,   { prefix: '/api/backup' })

// Brand header on every response
app.addHook('onSend', (_request, reply, _payload, done) => {
  reply.header('X-Powered-By', 'iki.ae')
  done()
})

// Health check
app.get('/api/health', async () => ({ status: 'ok', app: 'antri-iki-ae' }))

// Serve frontend — SPA fallback: all non-API routes return index.html
const distPath = path.resolve('/var/www/antri.iki.ae/frontend/dist')
await app.register(fastifyStatic, { root: distPath, prefix: '/' })
app.setNotFoundHandler((_req, reply) => {
  reply.sendFile('index.html')
})

await rebuildQueueState()
sendContactIfConsented() // fire-and-forget; errors are swallowed inside the service

try {
  await app.listen({ port: 3001, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
