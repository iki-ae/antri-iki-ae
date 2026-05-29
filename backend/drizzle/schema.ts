import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── config (single row) ──────────────────────────────────────────────────────
export const config = sqliteTable('config', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  institution_name: text('institution_name').notNull().default('Antri-Iki-Ae'),
  locale:           text('locale').notNull().default('id'),
  app_version:      text('app_version').notNull().default('1.0.0'),
  watermark_text:   text('watermark_text').notNull().default('Powered by iki.ae'),
  watermark_url:    text('watermark_url').notNull().default('https://iki.ae'),
  updated_at:       text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ─── categories ───────────────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  prefix:     text('prefix').notNull(),           // 'A', 'B', 'C'
  name:       text('name').notNull(),             // 'Pendaftaran', 'Pembayaran'
  color:      text('color').notNull().default('#378ADD'),
  sort_order: integer('sort_order').notNull().default(0),
  is_active:  integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── counters ───────────────────────────────────────────────────────────────────
export const counters = sqliteTable('counters', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),             // 'Counter 1', 'Counter A1'
  category_id: integer('category_id').notNull().references(() => categories.id),
  is_active:   integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at:  text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  name:          text('name').notNull(),
  username:      text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role:          text('role', { enum: ['admin', 'operator'] }).notNull(),
  counter_id:      integer('counter_id').references(() => counters.id), // null for admin
  is_active:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at:    text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── sessions ─────────────────────────────────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  date:        text('date').notNull(),             // 'YYYY-MM-DD'
  mode:        text('mode', { enum: ['bulk', 'kiosk'] }).notNull(),
  status:      text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  opened_at:   text('opened_at').notNull().default(sql`(datetime('now'))`),
  closed_at:   text('closed_at'),
  opened_by:   integer('opened_by').notNull().references(() => users.id),
})

// ─── tickets ──────────────────────────────────────────────────────────────────
export const tickets = sqliteTable('tickets', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  session_id:     integer('session_id').notNull().references(() => sessions.id),
  category_id:    integer('category_id').notNull().references(() => categories.id),
  number:         integer('number').notNull(),     // raw integer: 1, 2, 3
  display_number: text('display_number').notNull(),// formatted: 'A-001'
  status:         text('status', {
                    enum: ['waiting', 'called', 'recalled', 'serving', 'done', 'skipped']
                  }).notNull().default('waiting'),
  counter_id:       integer('counter_id').references(() => counters.id),
  called_at:      text('called_at'),
  served_at:      text('served_at'),
  skipped_at:     text('skipped_at'),
  created_at:     text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── audit_logs ───────────────────────────────────────────────────────────────
export const audit_logs = sqliteTable('audit_logs', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  user_id:    integer('user_id').references(() => users.id),
  action:     text('action').notNull(), // 'ticket.call', 'session.open', 'backup.export'
  payload:    text('payload'),          // JSON string
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── types ────────────────────────────────────────────────────────────────────
export type Config     = typeof config.$inferSelect
export type Category   = typeof categories.$inferSelect
export type Counter      = typeof counters.$inferSelect
export type User       = typeof users.$inferSelect
export type Session    = typeof sessions.$inferSelect
export type Ticket     = typeof tickets.$inferSelect
export type AuditLog   = typeof audit_logs.$inferSelect
