import Link from "next/link"
import { Building2, MapPin, Clock } from "lucide-react"
import { Badge, StatusBadge } from "@/components/ui/Badge"
import {
  formatarMoeda, formatarData, formatarDataHora, formatarRelativo,
  formatarEsfera, estaAberta, diasRestantes, truncar,
} from "@/lib/format"
import { idDetalhe, type EditalBusca } from "@/lib/pncp-search"

export function CardEdital({ edital: e, consultadoEm }: { edital: EditalBusca; consultadoEm: string }) {
  const prazoAberto = estaAberta(e.data_fim_vigencia)
  const confirmado  = prazoAberto && e.situacao_id === "1"
  const dias        = diasRestantes(e.data_fim_vigencia)
  const urgente     = prazoAberto && dias !== null && dias <= 3
  const href        = `/licitacoes/${idDetalhe(e)}`

  return (
    <article
      className="bg-white rounded-2xl border transition-shadow hover:shadow-md flex flex-col sm:flex-row"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Prazo em destaque */}
      <div
        className="sm:w-36 shrink-0 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-1 px-5 py-3 sm:py-4 rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl"
        style={{ background: urgente ? "rgb(240 68 56 / 0.06)" : "var(--canvas)" }}
      >
        <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-muted)" }}>
          Propostas até
        </span>
        <span className="flex items-center gap-1 font-semibold text-[15px]" style={{ color: urgente ? "var(--danger)" : "var(--navy)" }}>
          <Clock size={14} aria-hidden="true" />
          {e.data_fim_vigencia ? formatarRelativo(e.data_fim_vigencia) : "Não informado"}
        </span>
        {e.data_fim_vigencia && (
          <span className="text-[12px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            {formatarDataHora(e.data_fim_vigencia)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={href}
            className="font-semibold text-[15px] leading-snug line-clamp-2 hover:underline"
            style={{ color: "var(--navy)" }}
          >
            {e.description ? truncar(e.description, 180) : e.title ?? e.numero_controle_pncp}
          </Link>
          <StatusBadge aberta={prazoAberto} confirmado={confirmado} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <Building2 size={13} aria-hidden="true" />
            {e.orgao_nome ?? "Órgão não informado"}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} aria-hidden="true" />
            {e.municipio_nome ?? "Não informado"} – {e.uf ?? "—"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[14px] font-semibold tabular-nums mr-2" style={{ color: "var(--navy)" }}>
            {e.indicador_orcamento_sigiloso ? "Sigiloso" : formatarMoeda(e.valor_total_estimado)}
          </span>
          {e.modalidade_licitacao_nome && <Badge variante="navy">{e.modalidade_licitacao_nome}</Badge>}
          {e.esfera_id && <Badge variante="muted">{formatarEsfera(e.esfera_id)}</Badge>}
          {e.srp && <Badge variante="info">Registro de preços</Badge>}
        </div>

        <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ borderTop: "1px solid var(--border)", color: "var(--text-light)" }}>
          <span>
            Fonte: PNCP · {e.numero_controle_pncp} · publicado {formatarData(e.data_publicacao_pncp)} · consultado {consultadoEm}
          </span>
          <Link href={href} className="text-[12px] font-medium hover:underline" style={{ color: "var(--brand-ink)" }}>
            Ver itens e documentos →
          </Link>
        </div>
      </div>
    </article>
  )
}
