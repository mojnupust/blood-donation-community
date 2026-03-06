/**
 * lib/prisma.ts
 *
 * Global Prisma Client singleton.
 *
 * Problem: Next.js Fast Refresh re-executes module-level code on every hot
 * reload in development. Each execution would create a new PrismaClient,
 * opening a fresh connection pool and eventually exhausting the PostgreSQL
 * `max_connections` limit.
 *
 * Solution: Attach the client to `globalThis` (which persists across reloads)
 * and reuse it. In production this guard is irrelevant — modules are only
 * evaluated once — but it costs nothing to keep.
 */

import { PrismaClient } from "@prisma/client";

// Extend globalThis without polluting the global type namespace.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Emit query logs only in development so production stays quiet.
    // 'warn' and 'error' always surface important signals.
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
