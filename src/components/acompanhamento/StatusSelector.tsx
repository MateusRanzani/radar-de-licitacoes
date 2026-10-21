"use client"

import { useTransition } from "react"
import { definirStatus, type StatusPessoalValor } from "@/app/actions/licitacoes"

const OPCOES: { valor: StatusPessoalValor | null; label: string; cor: string }[] = [
  { valor: null,           label: "—",           cor: "#9ca3af" },
  { valor: "analisar",     label: "Analisar",     cor: "#f59e0b" },
  { valor: "interessante", label: "Interessante", cor: "#8b5cf6" },
  { valor: "participar",   label: "Participar",   cor: "#10b981" },
  { valor: "descartada",   label: "Descartada",   cor: "#6b7280" },
]

interface Props {
  contratacaoId: bigint
  statusAtual: string | null
}

export function StatusSelector({ contratacaoId, statusAtual }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-1">
      {OPCOES.slice(1).map((opcao) => {
        const ativo = opcao.valor === statusAtual
        return (
          <button
            key={opcao.valor}
            onClick={() =>
              startTransition(() =>
                definirStatus(contratacaoId, ativo ? null : opcao.valor),
              )
            }
            disabled={pending}
            className="h-6 px-2.5 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: ativo ? opcao.cor : "var(--border)",
              background:  ativo ? `${opcao.cor}18` : "transparent",
              color:        ativo ? opcao.cor : "var(--text-muted)",
              opacity:      pending ? 0.6 : 1,
            }}
          >
            {opcao.label}
          </button>
        )
      })}
    </div>
  )
}
