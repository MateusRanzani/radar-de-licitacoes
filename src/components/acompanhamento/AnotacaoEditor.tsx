"use client"

import { useState, useTransition } from "react"
import { MessageSquare, Save, Loader2 } from "lucide-react"
import { salvarAnotacao } from "@/app/actions/licitacoes"

interface Props {
  contratacaoId: bigint
  conteudoInicial: string
}

export function AnotacaoEditor({ contratacaoId, conteudoInicial }: Props) {
  const [expandido, setExpandido] = useState(!!conteudoInicial)
  const [conteudo, setConteudo] = useState(conteudoInicial)
  const [pending, startTransition] = useTransition()
  const [salvo, setSalvo] = useState(false)

  const salvar = () => {
    startTransition(async () => {
      await salvarAnotacao(contratacaoId, conteudo)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    })
  }

  if (!expandido) {
    return (
      <button
        onClick={() => setExpandido(true)}
        className="flex items-center gap-1.5 text-[12px] hover:underline"
        style={{ color: "var(--text-muted)" }}
      >
        <MessageSquare size={12} />
        Adicionar anotação
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--navy)" }}>
        <MessageSquare size={12} />
        Anotação
      </label>
      <textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        placeholder="Adicione suas observações sobre esta licitação…"
        rows={3}
        className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--border)", color: "var(--navy)" }}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={salvar}
          disabled={pending}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)", color: "var(--navy)" }}
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {salvo ? "Salvo!" : "Salvar"}
        </button>
        <button
          onClick={() => { setExpandido(false); setConteudo(conteudoInicial) }}
          className="text-xs hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
