/**
 * app/admin/layout.tsx
 *
 * Secure wrapper for every page under /admin.
 *
 * Why server-side auth check instead of middleware?
 *   Layout-level auth checks happen at the React Server Component layer and
 *   keep the auth logic co-located with the protected UI. They also run after
 *   Edge Middleware (if any), giving us two layers of protection.
 *
 * RBAC: only SUPER_ADMIN, ADMIN, and EDITOR roles are allowed. Any other
 * visitor (including unauthenticated users) is redirected to the login page.
 */

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import type { Role } from "@prisma/client"

const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Admin Top Navigation ─────────────────────────────────────────── */}
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm tracking-tight">
          🩸 Blood Donation — Admin Panel
        </span>
        <span className="text-xs text-muted-foreground">
          Logged in as{" "}
          <strong>{session.user.name}</strong>{" "}
          <span className="uppercase font-mono">({session.user.role})</span>
        </span>
      </header>

      <main className="p-6">{children}</main>
    </div>
  )
}
