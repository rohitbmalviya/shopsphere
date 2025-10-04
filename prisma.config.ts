// ============================================================
// ShopSphere — Prisma 7 Configuration
//
// Prisma 7 moved datasource URL out of schema.prisma and into
// this config file. The schema.prisma datasource block keeps only
// the provider declaration.
//
// To swap to PostgreSQL for production:
//   1. Change datasource.url to a postgres:// connection string
//   2. Change schema.prisma datasource provider to "postgresql"
//   3. Install @prisma/adapter-pg and update src/lib/db.ts
// ============================================================

import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
})
