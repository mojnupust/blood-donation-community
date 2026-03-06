/**
 * auth.ts
 *
 * NextAuth v5 (Auth.js) configuration.
 *
 * Why Credentials provider?
 *   The admin panel is internal-only; we own every account. Credentials lets us
 *   validate against our own `User` table with bcrypt-hashed passwords without
 *   the complexity of OAuth redirects for an admin audience.
 *
 * Security notes:
 * - Passwords are compared with bcrypt (never stored in plaintext in the DB).
 * - The JWT session strategy keeps the backend stateless; no session table needed.
 * - Role is embedded in the JWT so each request can verify RBAC without a DB hit.
 * - AUTH_SECRET must be a 32-byte random string (generated with
 *   `openssl rand -base64 32`). Rotating it invalidates all existing sessions.
 */

import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

// ── Extend the built-in types so `session.user.role` is type-safe ────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
  interface User {
    role: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        // Return only the fields we want to embed in the JWT.
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],

  session: {
    // JWT strategy: sessions are stateless; no session table needed.
    // The trade-off is that revoking a session requires rotating AUTH_SECRET.
    strategy: "jwt",
  },

  callbacks: {
    // Embed role and id into the JWT so downstream middleware can read them
    // without hitting the database on every request.
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = user.role
      }
      return token
    },
    // Expose id and role on the client-accessible session object.
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id   as string
        session.user.role = token.role as Role
      }
      return session
    },
  },

  pages: {
    signIn: "/admin/login",
  },
})
