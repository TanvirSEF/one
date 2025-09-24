import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { MongoDBAdapter } from "@auth/mongodb-adapter"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  adapter: MongoDBAdapter(clientPromise),
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim()
        const password = credentials?.password || ""
        if (!email || !password) return null

        const client = await clientPromise
        const db = client.db()
        const users = db.collection("users")

        const user = await users.findOne<{ _id: string; email: string; name?: string; password?: string; role?: string }>({ email })
        if (!user || !user.password) return null
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null

        if ((user.role || "user") !== "admin") return null

        return {
          id: String(user._id),
          email: user.email,
          name: user.name || "Admin",
          role: (user.role || "admin") as "admin",
        } as {
          id: string
          email: string
          name?: string
          role: "admin"
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as typeof token & { role?: "admin" }).role =
          (user as { role?: "admin" }).role || "admin"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as typeof session.user & { role?: "admin" }).role =
          (token as typeof token & { role?: "admin" }).role || "admin"
      }
      return session
    },
  },
}


