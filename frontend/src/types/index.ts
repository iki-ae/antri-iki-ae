export interface Config {
  id: number
  institution_name: string
  locale: string
  app_version: string
  updated_at: string
}

export interface Category {
  id: number
  prefix: string
  name: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Counter {
  id: number
  name: string
  category_id: number
  is_active: boolean
  created_at: string
}

export interface User {
  id: number
  name: string
  username: string
  role: 'admin' | 'operator'
  counter_id?: number
  is_active: boolean
}

export interface Session {
  id: number
  category_id: number
  date: string
  mode: 'bulk' | 'kiosk'
  status: 'open' | 'closed'
  opened_at: string
  closed_at?: string
}

export interface Ticket {
  id: number
  session_id: number
  category_id: number
  number: number
  display_number: string
  status: 'waiting' | 'called' | 'recalled' | 'serving' | 'done' | 'skipped'
  counter_id?: number
  called_at?: string
  served_at?: string
  skipped_at?: string
  created_at: string
}

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
    id: number
    name: string
    category: { id: number; prefix: string; name: string; color: string }
    currentTicket: { id: number; display_number: string; called_at: string } | null
  }[]
  waiting: { category_id: number; prefix: string; count: number }[]
  skipped: { id: number; display_number: string; category_id: number }[]
}
