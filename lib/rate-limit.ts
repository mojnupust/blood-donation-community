/**
 * lib/rate-limit.ts
 *
 * In-memory rate limiter using lru-cache.
 *
 * Why lru-cache instead of a Redis/Upstash solution?
 * For Phase 1 single-instance deployments this is zero-dependency, zero-latency,
 * and zero-cost. The LRU eviction policy prevents unbounded memory growth even
 * under sustained traffic by automatically pruning the oldest entries once the
 * cache reaches its maximum size.
 *
 * Upgrade path: swap this module for an Upstash Redis adapter when moving to
 * a multi-instance deployment without changing the call sites.
 */

import { LRUCache } from "lru-cache"

interface RateLimitOptions {
  /** Maximum number of requests per window. Default: 20 */
  limit?: number
  /** Window duration in milliseconds. Default: 60 000 (1 minute) */
  windowMs?: number
}

interface RateLimitResult {
  success: boolean
  /** Remaining requests in the current window */
  remaining: number
  /** Milliseconds until the window resets */
  resetAfter: number
}

// One shared cache instance per process (singleton via module-level const).
// Each key tracks { count, windowStart } for a given IP address.
const cache = new LRUCache<string, { count: number; windowStart: number }>({
  max: 10_000, // track up to 10 000 unique IPs at a time
  ttl: 60_000, // entries expire after 1 minute
})

/**
 * Check whether the given IP address is within the allowed rate limit.
 *
 * @param ip - The client's IP address (used as the cache key)
 * @param options - Optional overrides for limit and windowMs
 */
export function rateLimit(
  ip: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now()
  const entry = cache.get(ip)

  if (!entry || now - entry.windowStart >= windowMs) {
    // First request in this window (or window has expired) — reset counter.
    cache.set(ip, { count: 1, windowStart: now })
    return { success: true, remaining: limit - 1, resetAfter: windowMs }
  }

  if (entry.count >= limit) {
    const resetAfter = windowMs - (now - entry.windowStart)
    return { success: false, remaining: 0, resetAfter }
  }

  entry.count += 1
  return {
    success: true,
    remaining: limit - entry.count,
    resetAfter: windowMs - (now - entry.windowStart),
  }
}
