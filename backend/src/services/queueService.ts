import { db } from '../config/database.js'
import { tickets, counters, categories, sessions } from '../../drizzle/schema.js'
import { eq, and, asc, inArray } from 'drizzle-orm'

// ─── In-memory queue state (rebuilt from DB on startup + after each mutation) ─
let _state: QueueState = { sessions: [], counters: [], waiting: [], served: [], skipped: [] }

export interface CategorySession {
  id: number
  category_id: number
  date: string
  mode: string
  status: string
}

export interface QueueState {
  sessions: CategorySession[]
  counters: {
    id: number; name: string
    category: { id: number; prefix: string; name: string; color: string }
    currentTicket: { id: number; display_number: string; called_at: string } | null
  }[]
  waiting: { category_id: number; prefix: string; count: number }[]
  served: { category_id: number; count: number }[]
  skipped: { id: number; display_number: string; category_id: number }[]
}

export function getQueueState(): QueueState {
  return _state
}

export async function rebuildQueueState() {
  const openSessions = db
    .select()
    .from(sessions)
    .where(eq(sessions.status, 'open'))
    .all()

  if (!openSessions.length) {
    _state = { sessions: [], counters: [], waiting: [], served: [], skipped: [] }
    return
  }

  const openSessionIds = openSessions.map(s => s.id)
  const sessionByCategoryId = Object.fromEntries(openSessions.map(s => [s.category_id!, s]))

  const allCounters = db
    .select({ id: counters.id, name: counters.name, category_id: counters.category_id })
    .from(counters)
    .where(eq(counters.is_active, true))
    .all()

  const allCategories = db.select().from(categories).all()
  const catMap = Object.fromEntries(allCategories.map(c => [c.id, c]))

  const counterStates = allCounters.map(l => {
    const sessionForCategory = sessionByCategoryId[l.category_id]
    const current = sessionForCategory
      ? db
          .select()
          .from(tickets)
          .where(and(
            eq(tickets.session_id, sessionForCategory.id),
            eq(tickets.counter_id, l.id),
            inArray(tickets.status, ['called', 'recalled', 'serving'])
          ))
          .orderBy(asc(tickets.called_at))
          .get()
      : undefined

    const cat = catMap[l.category_id]
    return {
      id: l.id,
      name: l.name,
      category: { id: cat.id, prefix: cat.prefix, name: cat.name, color: cat.color },
      currentTicket: current
        ? { id: current.id, display_number: current.display_number, called_at: current.called_at! }
        : null,
    }
  })

  const waitingRows = db
    .select({ category_id: tickets.category_id })
    .from(tickets)
    .where(and(
      inArray(tickets.session_id, openSessionIds),
      eq(tickets.status, 'waiting')
    ))
    .all()

  const waitingCounts: Record<number, number> = {}
  for (const r of waitingRows) {
    waitingCounts[r.category_id] = (waitingCounts[r.category_id] ?? 0) + 1
  }

  const waiting = Object.entries(waitingCounts).map(([cat_id, count]) => ({
    category_id: Number(cat_id),
    prefix: catMap[Number(cat_id)]?.prefix ?? '?',
    count,
  }))

  const servedRows = db
    .select({ category_id: tickets.category_id })
    .from(tickets)
    .where(and(
      inArray(tickets.session_id, openSessionIds),
      eq(tickets.status, 'done')
    ))
    .all()

  const servedCounts: Record<number, number> = {}
  for (const r of servedRows) {
    servedCounts[r.category_id] = (servedCounts[r.category_id] ?? 0) + 1
  }

  const served = Object.entries(servedCounts).map(([cat_id, count]) => ({
    category_id: Number(cat_id),
    count,
  }))

  const skippedRows = db
    .select({ id: tickets.id, display_number: tickets.display_number, category_id: tickets.category_id })
    .from(tickets)
    .where(and(
      inArray(tickets.session_id, openSessionIds),
      eq(tickets.status, 'skipped')
    ))
    .orderBy(asc(tickets.number))
    .all()

  _state = {
    sessions: openSessions.map(s => ({
      id: s.id,
      category_id: s.category_id!,
      date: s.date,
      mode: s.mode,
      status: s.status,
    })),
    counters: counterStates,
    waiting,
    served,
    skipped: skippedRows,
  }
}

// ─── Ticket actions ───────────────────────────────────────────────────────────

export async function callNext(counter_id: number): Promise<{ ticket: any } | { error: string }> {
  const counter = db.select().from(counters).where(eq(counters.id, counter_id)).get()
  if (!counter) return { error: 'COUNTER_NOT_FOUND' }

  // Find the open session for this counter's category
  const session = db.select().from(sessions)
    .where(and(
      eq(sessions.status, 'open'),
      eq(sessions.category_id, counter.category_id)
    ))
    .get()
  if (!session) return { error: 'NO_ACTIVE_SESSION' }

  const now = new Date().toISOString()

  const claimed = db.transaction(() => {
    const active = db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.session_id, session.id),
        eq(tickets.counter_id, counter_id),
        inArray(tickets.status, ['called', 'recalled', 'serving'])
      ))
      .get()

    if (active) return 'COUNTER_HAS_ACTIVE_TICKET' as const

    const next = db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.session_id, session.id),
        eq(tickets.category_id, counter.category_id),
        eq(tickets.status, 'waiting')
      ))
      .orderBy(asc(tickets.number))
      .get()

    if (!next) return null

    db.update(tickets)
      .set({ status: 'called', counter_id, called_at: now })
      .where(eq(tickets.id, next.id))
      .run()

    return next
  })

  if (claimed === 'COUNTER_HAS_ACTIVE_TICKET') return { error: 'COUNTER_HAS_ACTIVE_TICKET' }
  if (!claimed) return { error: 'NO_TICKETS_WAITING' }

  await rebuildQueueState()
  return { ticket: { ...claimed, status: 'called', counter_id, called_at: now } }
}

export async function recallTicket(ticket_id: number): Promise<{ ticket: any } | { error: string }> {
  const ticket = db.select().from(tickets).where(eq(tickets.id, ticket_id)).get()
  if (!ticket) return { error: 'TICKET_NOT_FOUND' }
  if (!['called', 'recalled', 'serving'].includes(ticket.status)) return { error: 'TICKET_CANNOT_RECALL' }

  const now = new Date().toISOString()
  db.update(tickets).set({ status: 'recalled', called_at: now }).where(eq(tickets.id, ticket_id)).run()
  await rebuildQueueState()
  return { ticket: { ...ticket, status: 'recalled', called_at: now } }
}

export async function skipTicket(ticket_id: number): Promise<{ ok: true } | { error: string }> {
  const ticket = db.select().from(tickets).where(eq(tickets.id, ticket_id)).get()
  if (!ticket) return { error: 'TICKET_NOT_FOUND' }

  db.update(tickets)
    .set({ status: 'skipped', skipped_at: new Date().toISOString() })
    .where(eq(tickets.id, ticket_id))
    .run()
  await rebuildQueueState()
  return { ok: true }
}

export async function serveTicket(ticket_id: number): Promise<{ ok: true } | { error: string }> {
  const ticket = db.select().from(tickets).where(eq(tickets.id, ticket_id)).get()
  if (!ticket) return { error: 'TICKET_NOT_FOUND' }

  db.update(tickets)
    .set({ status: 'done', served_at: new Date().toISOString() })
    .where(eq(tickets.id, ticket_id))
    .run()
  await rebuildQueueState()
  return { ok: true }
}

export async function callSkippedTicket(ticket_id: number, counter_id: number): Promise<{ ticket: any } | { error: string }> {
  const ticket = db.select().from(tickets).where(eq(tickets.id, ticket_id)).get()
  if (!ticket) return { error: 'TICKET_NOT_FOUND' }
  if (ticket.status !== 'skipped') return { error: 'TICKET_NOT_SKIPPED' }

  const counter = db.select().from(counters).where(eq(counters.id, counter_id)).get()
  if (!counter) return { error: 'COUNTER_NOT_FOUND' }

  const now = new Date().toISOString()
  db.update(tickets)
    .set({ status: 'called', counter_id, called_at: now })
    .where(eq(tickets.id, ticket_id))
    .run()

  await rebuildQueueState()
  return { ticket: { ...ticket, status: 'called', counter_id, called_at: now } }
}

export function formatDisplayNumber(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(3, '0')}`
}

export function nextTicketNumber(session_id: number, category_id: number): number {
  const last = db
    .select({ number: tickets.number })
    .from(tickets)
    .where(and(eq(tickets.session_id, session_id), eq(tickets.category_id, category_id)))
    .orderBy(asc(tickets.number))
    .all()
  return last.length > 0 ? Math.max(...last.map(t => t.number)) + 1 : 1
}
