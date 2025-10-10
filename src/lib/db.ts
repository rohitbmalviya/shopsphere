// ============================================================
// ShopSphere — Prisma Client Singleton
//
// Prisma 7 requires a driver adapter; it no longer ships a
// bundled Rust query engine.
//
// We use @prisma/adapter-libsql which wraps @libsql/client and
// ships prebuilt napi-rs binaries (darwin-arm64, linux-x64, etc.)
// — no native compilation step required.
//
// PrismaLibSql takes a libsql Config object (with a `url` field),
// NOT a pre-created @libsql/client instance.
//
// For local SQLite the URL must be "file:<absolute-path>".
// The DATABASE_URL env var uses the "file:./prisma/dev.db" form;
// we resolve it to an absolute path here so libSQL can find it
// regardless of the process working directory.
//
// The global-instance pattern prevents hot-reload in Next.js
// development from opening a new file handle on every save.
//
// Import path for all other modules:
//   import { db } from '@/lib/db'
// ============================================================

import path from 'node:path'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/generated/prisma/client'

function buildLibSQLUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'

  // If it's already a libsql:// or http:// URL (e.g. Turso prod), pass through.
  if (!raw.startsWith('file:')) return raw

  // Strip the "file:" prefix, resolve relative paths from the project root.
  // process.cwd() in Next.js is always the project root.
  const filePart = raw.slice('file:'.length)
  const absPath = path.isAbsolute(filePart)
    ? filePart
    : path.resolve(process.cwd(), filePart)

  return `file:${absPath}`
}

// PrismaLibSql takes a libsql Config object directly (not a pre-created client).
const adapter = new PrismaLibSql({ url: buildLibSQLUrl() })

// Extend globalThis so the TypeScript narrowing is preserved and
// we don't open a second connection on every Next.js hot reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
