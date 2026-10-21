import Link from "next/link"
import { ExternalLink, Calendar, MapPin, Building2, AlertTriangle } from "lucide-react"
import { Badge, StatusBadge } from "@/components/ui/Badge"
import { formatarMoeda, formatarData, formatarRelativo, estaAberta, truncar, diasRestantes } from "@/lib/format"
import { contratacaoId } from "@/lib/pncp"
import type { PncpContratacao } from "@/lib/types"

interface CardLicitacaoProps {
  licitacao: PncpContratacao
  compacto?: boolean
}

export function CardLicitacao({ licitacao: l, compacto = false }: CardLicitacaoProps) {
  const id = contratacaoId(l)
  const prazoAberto = estaAberta(l.dataEncerramentoProposta)

  // "Aberta confirmada" = situação ativa no PNCP E prazo ainda no futuro
  const situacaoAberta = l.situacaoCompraId === 1 // 1 = Divulgada (proposta aberta)
  const abertoConfirmado = situacaoAberta && prazoAberto

  // Prazo próximo = ≤ 3 dias
  const diffDias     = diasRestantes(l.dataEncerramentoProposta)
  const prazoPróximo = diffDias !== null && diffDias >= 0 && diffDias <= 3

  return (
    <article
      className="group bg-white rounded-2xl border transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--border)" }}
    >
      <div className={compacto ? "px-4 py-3" : "px-5 py-4"}>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/licitacoes/${id}`}
              className="font-semibold text-[15px] leading-snug line-clamp-2 hover:underline"
              style={{ color: "var(--navy)" }}
            >
              {l.objetoCompra ? truncar(l.objetoCompra, 120) : `Contratação ${l.numeroControlePNCP}`}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <StatusBadge aberta={prazoAberto} confirmado={abertoConfirmado} />
            {prazoPróximo && (
              <Badge variante="danger" className="gap-1">
                <AlertTriangle size={10} />
                Urgente
              </Badge>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <Building2 size={13} aria-hidden="true" />
            {l.unidadeOrgao.nomeUnidade}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} aria-hidden="true" />
            {l.unidadeOrgao.municipioNome} – {l.unidadeOrgao.ufSigla}
          </span>
        </div>

        {!compacto && (
          <>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge variante="navy">{l.modalidadeNome}</Badge>
              {l.modoDisputaNome && <Badge variante="muted">{l.modoDisputaNome}</Badge>}
              {l.srp && <Badge variante="info">SRP</Badge>}
              {l.orgaoEntidade.esferaId === "F" && <Badge variante="brand">Federal</Badge>}
              {l.orgaoEntidade.esferaId === "E" && <Badge variante="muted">Estadual</Badge>}
              {l.orgaoEntidade.esferaId === "M" && <Badge variante="muted">Municipal</Badge>}
            </div>

            {/* Rodapé */}
            <div className="mt-3 pt-3 flex items-end justify-between gap-3" style={{ borderTop: "1px solid var(--border)" }}>
              {/* Valor + datas */}
              <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-[13px]">
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Estimado </span>
                  <span className="font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
                    {l.indicadorOrcamentoSigiloso ? "Sigiloso" : formatarMoeda(l.valorTotalEstimado)}
                  </span>
                </div>
                {l.dataEncerramentoProposta && (
                  <div className="flex items-center gap-1" style={{ color: prazoPróximo ? "var(--danger)" : "var(--text-muted)" }}>
                    <Calendar size={12} aria-hidden="true" />
                    <span>Encerra </span>
                    <span className="font-medium">{formatarRelativo(l.dataEncerramentoProposta)}</span>
                    <span className="opacity-60">({formatarData(l.dataEncerramentoProposta)})</span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 shrink-0">
                {l.linkSistemaOrigem && (
                  <a
                    href={l.linkSistemaOrigem}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] font-medium hover:underline"
                    style={{ color: "var(--brand-ink)" }}
                    title="Ver no portal de origem"
                  >
                    <ExternalLink size={12} />
                    {l.usuarioNome ?? "Portal de origem"}
                  </a>
                )}
                <Link
                  href={`/licitacoes/${id}`}
                  className="text-[12px] font-medium hover:underline"
                  style={{ color: "var(--brand-ink)" }}
                >
                  Ver detalhes →
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Rodapé compacto */}
        {compacto && (
          <div className="mt-2 flex items-center justify-between gap-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
            <span className="font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
              {l.indicadorOrcamentoSigiloso ? "Sigiloso" : formatarMoeda(l.valorTotalEstimado)}
            </span>
            {l.dataEncerramentoProposta && (
              <span style={{ color: prazoPróximo ? "var(--danger)" : undefined }}>
                até {formatarData(l.dataEncerramentoProposta)}
              </span>
            )}
            <Link href={`/licitacoes/${id}`} className="hover:underline" style={{ color: "var(--brand-ink)" }}>
              Detalhes →
            </Link>
          </div>
        )}

        {/* Metadados de origem — sempre visível */}
        <p className="mt-2 text-[11px]" style={{ color: "var(--text-light)" }}>
          Fonte: PNCP · {l.numeroControlePNCP} · consulta ao vivo
        </p>
      </div>
    </article>
  )
}
