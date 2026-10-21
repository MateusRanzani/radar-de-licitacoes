"use client"

import Link from "next/link"
import { useActionState } from "react"
import { loginAction } from "@/app/actions/auth"

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {})

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-2xl border bg-white p-8"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Logo + título */}
        <div className="text-center mb-8">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white mb-4"
            style={{ background: "var(--brand)" }}
          >
            LR
          </span>
          <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Entrar no LicitaRadar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Acesse sua conta para monitorar licitações
          </p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: "var(--navy)" }}>
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--navy)" }}>
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}
            />
          </div>

          {state.error && (
            <p
              className="rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgb(239 68 68 / 0.08)", color: "var(--danger)" }}
              role="alert"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--brand)", color: "var(--navy)" }}
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium hover:underline" style={{ color: "var(--brand-ink)" }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
