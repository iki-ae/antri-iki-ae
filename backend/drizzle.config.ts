import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: '/var/www/antri.iki.ae/backend/data/antri-iki-ae.db',
  },
} satisfies Config
