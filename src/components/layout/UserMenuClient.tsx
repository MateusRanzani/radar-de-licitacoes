"use client"

import Link from "next/link"
import { useState } from "react"
import { User, LogOut, LogIn } from "lucide-react"
import { logoutAction } from "@/app/actions/auth"

interface Props {
  usuario: { nome: string; email: string } | null
}

export function UserMenuClient({ usuario }: Props) {
  const [aberto, setAberto] = useState(false)

  if (!usuario) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium transition-colors hover:opacity-90"
        style={{ background: "var(--brand)", color: "var(--navy)" }}
      >
        <LogIn size={14} />
        Entrar
      </Link>
    )
  }

  const iniciais = usuario.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 h-9 px-3 rounded-full transition-colors hover:bg-black/5"
        style={{ color: "var(--navy)" }}
        aria-label="Menu do usuário"
        aria-expanded={aberto}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          {iniciais || <User size={12} />}
        </span>
        <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
          {usuario.nome.split(" ")[0]}
        </span>
      </button>

      {aberto && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-10 z-50 w-48 rounded-2xl border bg-white py-1 shadow-lg"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold truncate" style={{ color: "var(--navy)" }}>{usuario.nome}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{usuario.email}</p>
            </div>
            <Link
              href="/acompanhamento"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
              style={{ color: "var(--navy)" }}
              onClick={() => setAberto(false)}
            >
              Acompanhamento
            </Link>
            <form
              action={logoutAction}
              className="border-t mt-1"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                style={{ color: "var(--danger)" }}
              >
                <LogOut size={14} />
                Sair
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
