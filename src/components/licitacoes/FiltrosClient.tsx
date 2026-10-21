"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Filter, X, LayoutList, AlignJustify } from "lucide-react"
import { UFS } from "@/lib/constants"
import type { PncpModalidade } from "@/lib/types"

interface FiltrosClientProps {
  modalidades: PncpModalidade[]
  totalRegistros: number
  visualizacao: "lista" | "compacto"
}

export function FiltrosClient({ modalidades, totalRegistros, visualizacao }: FiltrosClientProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const params    = useSearchParams()
  const [pending, startTransition] = useTransition()

  const atualizar = useCallback((chave: string, valor: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (valor) {
      next.set(chave, valor)
    } else {
      next.delete(chave)
    }
    next.delete("pagina")
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`)
    })
  }, [params, pathname, router])

  const limpar = useCallback(() => {
    startTransition(() => router.push(`${pathname}?modo=lista`))
  }, [pathname, router])

  const ufAtual    = params.get("uf")
  const modAtual   = params.get("modalidade")
  const vizAtual   = params.get("visualizacao") || visualizacao
  const temFiltro  = !!ufAtual || !!modAtual

  return (
    <div className="flex flex-col gap-2">
      {/* Linha de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Contador + fonte */}
        <span
          className="text-sm font-medium mr-1 tabular-nums flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
          aria-live="polite"
          aria-atomic="true"
        >
          {pending ? "Buscando…" : `${totalRegistros.toLocaleString("pt-BR")} resultado${totalRegistros !== 1 ? "s" : ""}`}
        </span>

        <Filter size={15} style={{ color: "var(--text-muted)" }} aria-hidden="true" />

        {/* Filtro UF */}
        <select
          value={ufAtual ?? ""}
          onChange={(e) => atualizar("uf", e.target.value || null)}
          className="h-8 rounded-lg border px-2 text-sm bg-white focus:outline-none focus:ring-2"
          style={{
            borderColor: ufAtual ? "var(--brand)" : "var(--border)",
            color: "var(--navy)",
          }}
          aria-label="Filtrar por estado"
          disabled={pending}
        >
          <option value="">Todos os estados</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>

        {/* Filtro modalidade */}
        <select
          value={modAtual ?? ""}
          onChange={(e) => atualizar("modalidade", e.target.value || null)}
          className="h-8 rounded-lg border px-2 text-sm bg-white focus:outline-none focus:ring-2"
          style={{
            borderColor: modAtual ? "var(--brand)" : "var(--border)",
            color: "var(--navy)",
            maxWidth: "220px",
          }}
          aria-label="Filtrar por modalidade"
          disabled={pending}
        >
          <option value="">Todas as modalidades</option>
          {modalidades.filter((m) => m.statusAtivo).map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>

        {/* Limpar filtros */}
        {temFiltro && (
          <button
            onClick={limpar}
            className="flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50"
            style={{ borderColor: "var(--border)", color: "var(--danger)" }}
            disabled={pending}
            aria-label="Limpar todos os filtros"
          >
            <X size={13} />
            Limpar
          </button>
        )}

        <div className="flex-1" />

        {/* Toggle visualização */}
        <div
          className="flex items-center gap-0.5 p-1 rounded-lg"
          style={{ background: "var(--border)" }}
          role="group"
          aria-label="Tipo de visualização"
        >
          {(["lista", "compacto"] as const).map((v) => (
            <button
              key={v}
              onClick={() => atualizar("visualizacao", v)}
              className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
              style={{
                background: vizAtual === v ? "white" : "transparent",
                color:      vizAtual === v ? "var(--navy)" : "var(--text-muted)",
                boxShadow:  vizAtual === v ? "0 1px 3px rgb(16 24 40 / 0.12)" : "none",
              }}
              aria-label={v === "lista" ? "Visualização em lista" : "Visualização compacta"}
              aria-pressed={vizAtual === v}
            >
              {v === "lista" ? <LayoutList size={15} /> : <AlignJustify size={15} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
