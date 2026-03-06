/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * Mounts the NextAuth v5 request handlers at /api/auth/*.
 * All configuration lives in the root auth.ts file; this file is intentionally
 * minimal — it just re-exports the GET/POST handlers that Auth.js needs.
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers
