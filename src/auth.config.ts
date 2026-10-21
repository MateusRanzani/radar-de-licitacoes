import type { NextAuthConfig } from "next-auth"

// Edge-safe: sem imports de banco ou Node.js — usado pelo middleware
export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/cadastro",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const logado = !!auth?.user
      const rotasProtegidas = ["/acompanhamento", "/painel"]
      const ehProtegida = rotasProtegidas.some((p) => nextUrl.pathname.startsWith(p))
      if (ehProtegida) return logado
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id    = user.id as string
        token.papel = (user as { papel?: string }).papel ?? "usuario"
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.papel) (session.user as { papel?: string }).papel = token.papel as string
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
