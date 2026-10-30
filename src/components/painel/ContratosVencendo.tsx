"use client"

import { useState, useCallback } from "react"
import { AlertTriangle, Calendar, RefreshCw, Settings, Building2, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

interface Contrato {
  numeroControlePNCP: string | null
  objetoContrato: string
  fornecedor: string
  valorGlobal: number | null
  dataVigenciaFim: string
  dataAssinatura: string | null
  diasRestantes: number
  processo: string | null
}

interface Props {
  cnpjOrgao: string | null
  nomeOrgao: string | null
}

type Fase = "idle" | "carregando" | "ok" | "erro"

export function ContratosVencendo({ cnpjOrgao, nomeOrgao }: Props) {
  const [fase, setFase] = useState<Fase>("idle")
  const [dias, setDias] = useState(90)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [limitado, setLimitado] = useState(false)
  const [consultadoEm, setConsultadoEm] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set())

  const buscar = useCallback(async (d: number) => {
    if (!cnpjOrgao) return
    setFase("carregando")
    setErro(null)
    try {
      const r = await fetch(`/api/pncp/contratos-vencendo?cnpj=${cnpjOrgao}&dias=${d}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
      setContratos(j.contratos)
      setLimitado(j.limitado)
      setConsultadoEm(j.consultadoEm)
      setFase("ok")
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
      setFase("erro")
    }
  }, [cnpjOrgao])

  const toggleExpandido = (i: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(i)) { next.delete(i) } else { next.add(i) }
      return next
    })
  }

  // ── Sem CNPJ configurado ─────────────────────────────────────────────────── //
  if (!cnpjOrgao) {
    return (
      <section
        className="rounded-2xl border bg-white p-5"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--navy)" }}>
          Contratos vencendo
        </h2>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Building2 size={24} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Configure o CNPJ do seu órgão para ver contratos prestes a vencer.
          </p>
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 mt-2 h-9 px-4 rounded-xl text-sm font-medium"
            style={{ background: "var(--brand)", color: "var(--navy)" }}
          >
            <Settings size={14} />
            Configurar perfil
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      className="rounded-2xl border bg-white p-5 space-y-4"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
            Contratos vencendo
          </h2>
          {nomeOrgao && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{nomeOrgao}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["30", "60", "90"] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDias(+d); buscar(+d) }}
              className="h-7 px-3 rounded-full text-xs font-medium transition-colors"
              style={{
                background: dias === +d && fase !== "idle" ? "var(--brand)" : "var(--border)",
                color: dias === +d && fase !== "idle" ? "var(--navy)" : "var(--text-muted)",
              }}
            >
              {d} dias
            </button>
          ))}
          {fase === "idle" && (
            <button
              onClick={() => buscar(dias)}
              className="h-7 px-4 rounded-full text-xs font-medium"
              style={{ background: "var(--brand)", color: "var(--navy)" }}
            >
              Consultar PNCP
            </button>
          )}
          {fase !== "idle" && (
            <button
              onClick={() => buscar(dias)}
              className="flex items-center gap-1 h-7 px-3 rounded-full text-xs"
              style={{ background: "var(--border)", color: "var(--text-muted)" }}
              disabled={fase === "carregando"}
            >
              <RefreshCw size={12} className={fase === "carregando" ? "animate-spin" : ""} />
              Atualizar
            </button>
          )}
        </div>
      </div>

      {/* Estados */}
      {fase === "idle" && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          Clique em &quot;Consultar PNCP&quot; para buscar contratos vencendo nos próximos {dias} dias.
        </p>
      )}

      {fase === "carregando" && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
          ))}
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Consultando PNCP…
          </p>
        </div>
      )}

      {fase === "erro" && (
        <div
          className="flex items-start gap-2 rounded-xl border p-4 text-sm"
          style={{ borderColor: "#FCA5A5", background: "#FEF2F2", color: "#991B1B" }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {fase === "ok" && contratos.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>
            Nenhum contrato vencendo nos próximos {dias} dias
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Baseado em contratos publicados no PNCP no último ano.
          </p>
        </div>
      )}

      {fase === "ok" && contratos.length > 0 && (
        <div className="space-y-2">
          {contratos.map((c, i) => {
            const expandido = expandidos.has(i)
            const urgencia = c.diasRestantes <= 15 ? "high" : c.diasRestantes <= 30 ? "medium" : "low"
            const corDias = urgencia === "high" ? "#991B1B" : urgencia === "medium" ? "#92400E" : "#14532D"
            const bgDias  = urgencia === "high" ? "#FEF2F2" : urgencia === "medium" ? "#FFFBEB" : "#F0FDF4"

            return (
              <div
                key={i}
                className="rounded-xl border"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  type="button"
                  className="w-full flex items-start gap-3 p-3 text-left"
                  onClick={() => toggleExpandido(i)}
                >
                  <span
                    className="shrink-0 mt-0.5 flex h-6 items-center px-2 rounded-full text-xs font-semibold tabular-nums"
                    style={{ background: bgDias, color: corDias }}
                  >
                    {c.diasRestantes}d
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium line-clamp-1" style={{ color: "var(--navy)" }}>
                      {c.objetoContrato}
                    </span>
                    <span className="block text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                      {c.fornecedor}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums font-semibold" style={{ color: "var(--navy)" }}>
                    {c.valorGlobal != null
                      ? `R$ ${c.valorGlobal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  {expandido ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} className="shrink-0 mt-0.5" />
                             : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} className="shrink-0 mt-0.5" />}
                </button>

                {expandido && (
                  <div
                    className="px-3 pb-3 border-t pt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    <span><strong style={{ color: "var(--navy)" }}>Vencimento:</strong> {formatarData(c.dataVigenciaFim)}</span>
                    <span><strong style={{ color: "var(--navy)" }}>Assinatura:</strong> {c.dataAssinatura ? formatarData(c.dataAssinatura) : "Não informado"}</span>
                    {c.processo && <span className="col-span-2"><strong style={{ color: "var(--navy)" }}>Processo:</strong> {c.processo}</span>}
                    {c.numeroControlePNCP && (
                      <span className="col-span-2">
                        <strong style={{ color: "var(--navy)" }}>PNCP:</strong>{" "}
                        <span className="font-mono">{c.numeroControlePNCP}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Rodapé */}
      {fase === "ok" && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {limitado && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "#92400E" }}
            >
              <AlertTriangle size={12} />
              Resultado limitado — consulte o PNCP para lista completa.
            </span>
          )}
          {consultadoEm && (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Calendar size={11} />
              Consultado em {new Date(consultadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
              {" · "}Fonte: <a href="https://pncp.gov.br" target="_blank" rel="noopener noreferrer" className="underline">PNCP</a>
            </span>
          )}
        </div>
      )}
    </section>
  )
}

function formatarData(d: string): string {
  const [ano, mes, dia] = d.split("T")[0].split("-")
  return `${dia}/${mes}/${ano}`
}
