import "server-only"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { db } from "./db"
import { usuarios } from "./db/schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: "E-mail",  type: "email"    },
        password: { label: "Senha",   type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).toLowerCase().trim()
        const [user] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, email))
          .limit(1)

        if (!user?.senhaHash) return null

        const ok = await bcrypt.compare(String(credentials.password), user.senhaHash)
        if (!ok) return null

        return {
          id:    user.id,
          email: user.email,
          name:  user.nome ?? user.email.split("@")[0],
          papel: user.papel,
        } as { id: string; email: string; name: string; papel: string }
      },
    }),
  ],
})
