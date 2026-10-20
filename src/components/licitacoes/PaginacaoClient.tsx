"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTransition } from "react"

interface PaginacaoProps {
  paginaAtual: number
  totalPaginas: number
}

export function PaginacaoClient({ paginaAtual, totalPaginas }: PaginacaoProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const [pending, startTransition] = useTransition()

  if (totalPaginas <= 1) return null

  const ir = (p: number) => {
    const next = new URLSearchParams(params.toString())
    next.set("pagina", String(p))
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  // Janela de páginas visíveis
  const inicio = Math.max(1, paginaAtual - 2)
  const fim    = Math.min(totalPaginas, paginaAtual + 2)
  const paginas = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i)

  return (
    <nav
      className="flex items-center justify-center gap-1 py-6"
      aria-label="Paginação"
    >
      <BtnPage
        onClick={() => ir(paginaAtual - 1)}
        disabled={paginaAtual === 1 || pending}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </BtnPage>

      {inicio > 1 && (
        <>
          <BtnPage onClick={() => ir(1)} disabled={pending}>1</BtnPage>
          {inicio > 2 && <span className="px-1 text-sm" style={{ color: "var(--text-muted)" }}>…</span>}
        </>
      )}

      {paginas.map((p) => (
        <BtnPage
          key={p}
          onClick={() => ir(p)}
          ativo={p === paginaAtual}
          disabled={pending}
          aria-current={p === paginaAtual ? "page" : undefined}
        >
          {p}
        </BtnPage>
      ))}

      {fim < totalPaginas && (
        <>
          {fim < totalPaginas - 1 && <span className="px-1 text-sm" style={{ color: "var(--text-muted)" }}>…</span>}
          <BtnPage onClick={() => ir(totalPaginas)} disabled={pending}>{totalPaginas}</BtnPage>
        </>
      )}

      <BtnPage
        onClick={() => ir(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas || pending}
        aria-label="Próxima página"
      >
        <ChevronRight size={16} />
      </BtnPage>
    </nav>
  )
}

function BtnPage({
  children, onClick, disabled, ativo, "aria-label": ariaLabel, "aria-current": ariaCurrent,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  ativo?: boolean
  "aria-label"?: string
  "aria-current"?: "page" | undefined
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className="h-8 min-w-[2rem] px-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: ativo ? "var(--brand)" : "transparent",
        color:      ativo ? "var(--navy)" : "var(--text-muted)",
        border:     ativo ? "none" : "1px solid var(--border)",
      }}
    >
      {children}
    </button>
  )
}
