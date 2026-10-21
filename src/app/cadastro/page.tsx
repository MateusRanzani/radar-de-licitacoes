"use client"

import Link from "next/link"
import { useActionState } from "react"
import { cadastrarAction } from "@/app/actions/auth"

export default function CadastroPage() {
  const [state, action, pending] = useActionState(cadastrarAction, {})

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-2xl border bg-white p-8"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="text-center mb-8">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white mb-4"
            style={{ background: "var(--brand)" }}
          >
            LR
          </span>
          <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Criar conta</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Monitore licitações e receba alertas
          </p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-sm font-medium" style={{ color: "var(--navy)" }}>
              Nome completo
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              autoComplete="name"
              placeholder="João Silva"
              className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}
            />
          </div>

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
            <label htmlFor="senha" className="text-sm font-medium" style={{ color: "var(--navy)" }}>
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              className="h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmacao" className="text-sm font-medium" style={{ color: "var(--navy)" }}>
              Confirmar senha
            </label>
            <input
              id="confirmacao"
              name="confirmacao"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repita a senha"
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
            {pending ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--brand-ink)" }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
