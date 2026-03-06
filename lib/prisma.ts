/**
 * lib/prisma.ts
 *
 * Global Prisma Client singleton with the PostgreSQL driver adapter.
 *
 * Prisma v7 requires an explicit driver adapter. We use `@prisma/adapter-pg`
 * backed by the standard `pg` connection pool.
 *
 * The client is created lazily on first access so that the module can be
 * imported during Next.js build-time static analysis without throwing when
 * DATABASE_URL is not available in the build environment.
 *
 * Why a globalThis singleton?
 *   Next.js Fast Refresh re-executes module-level code on every hot reload in
 *   development. Without the guard each reload would open a new connection pool
 *   and eventually exhaust PostgreSQL's `max_connections`.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Extend globalThis without polluting the global type namespace.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Add it to your .env file before starting the server."
    )
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl })

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  })
}

// Lazily initialise: only create the client when it is first accessed.
let _prisma: PrismaClient | undefined

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  if (!_prisma) {
    _prisma = createPrismaClient()
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _prisma
    }
  }
  return _prisma
}

// Keep a named `prisma` export for convenience in all call sites.
//
// Why a Proxy instead of exporting `getPrisma()` directly?
//   Call sites write `prisma.donor.findMany(...)` not `getPrisma().donor.findMany(...)`.
//   A Proxy lets us keep that ergonomic API while still deferring client
//   construction until the first actual property access (i.e., first query).
//   Tradeoff: stack traces will show an extra proxy getter frame. Debug with
//   `getPrisma()` directly if you need a clean trace.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
