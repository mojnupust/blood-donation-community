/**
 * app/api/donors/route.ts
 *
 * Public GET endpoint for the donor directory.
 *
 * Features:
 * - Rate limiting: 20 req/min per IP (in-memory lru-cache)
 * - Server-side pagination via `page` and `limit` query params
 * - Dynamic filtering by name, bloodGroup, village, wardNumber,
 *   union, upazila, district, mobile (all case-insensitive partial match)
 * - Returns total count alongside data so the client can render page controls
 *
 * Why server-side pagination?
 *   Fetching all rows to the client and slicing in JS would OOM the server
 *   and overwhelm the browser on large datasets. Pushing skip/take into the
 *   SQL query means only the requested page ever leaves the DB.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import type { Prisma } from "@prisma/client"

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

/** Extract the best-effort client IP from common proxy headers. */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function GET(req: NextRequest) {
  // ── 1. Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(req)
  const { success, remaining, resetAfter } = rateLimit(ip)

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(Math.ceil(resetAfter / 1000)),
        },
      }
    )
  }

  // ── 2. Parse & validate query parameters ────────────────────────────────────
  const { searchParams } = req.nextUrl

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10))
  )
  const skip = (page - 1) * limit

  // Filter params — empty string treated as "no filter"
  const name       = searchParams.get("name")?.trim()
  const bloodGroup = searchParams.get("bloodGroup")?.trim()
  const village    = searchParams.get("village")?.trim()
  const wardNumber = searchParams.get("wardNumber")?.trim()
  const union      = searchParams.get("union")?.trim()
  const upazila    = searchParams.get("upazila")?.trim()
  const district   = searchParams.get("district")?.trim()
  const mobile     = searchParams.get("mobile")?.trim()

  // ── 3. Build Prisma where clause ────────────────────────────────────────────
  // Each filter is only applied when the param is non-empty.
  // `contains` + `mode: "insensitive"` maps to SQL ILIKE, which is fast when
  // the indexed column is also covered by a trigram index (pg_trgm). For exact
  // prefix matching, switch to `startsWith`; for exact match, use `equals`.
  const where: Prisma.DonorWhereInput = {
    ...(name       && { name:       { contains: name,       mode: "insensitive" } }),
    // Defensive: the UI converts "all" to an empty string before sending, but
    // guard here too in case a raw API call passes "all" as the value.
    ...(bloodGroup && bloodGroup !== "all" && { bloodGroup: { equals:   bloodGroup, mode: "insensitive" } }),
    ...(village    && { village:    { contains: village,    mode: "insensitive" } }),
    ...(wardNumber && { wardNumber: { contains: wardNumber, mode: "insensitive" } }),
    ...(union      && { union:      { contains: union,      mode: "insensitive" } }),
    ...(upazila    && { upazila:    { contains: upazila,    mode: "insensitive" } }),
    ...(district   && { district:   { contains: district,   mode: "insensitive" } }),
    ...(mobile     && { mobile:     { contains: mobile,     mode: "insensitive" } }),
  }

  // ── 4. Execute count + paginated query in parallel ──────────────────────────
  // Running both in a single transaction ensures count and data are consistent.
  try {
    const [total, donors] = await prisma.$transaction([
      prisma.donor.count({ where }),
      prisma.donor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id:          true,
          name:        true,
          fatherName:  true,
          village:     true,
          wardNumber:  true,
          union:       true,
          upazila:     true,
          district:    true,
          mobile:      true,
          bloodGroup:  true,
          profession:  true,
          isAvailable: true,
        },
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        data: donors,
        pagination: { page, limit, total, totalPages },
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    )
  } catch (error) {
    console.error("[GET /api/donors] Database error:", error)
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    )
  }
}
