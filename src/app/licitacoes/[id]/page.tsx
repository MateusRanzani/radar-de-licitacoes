import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import {
  buscarContratacao, buscarItens, buscarArquivos,
  parseContratacaoId,
} from "@/lib/pncp"
import {
  formatarMoeda, formatarDataHora, formatarData,
  formatarRelativo, formatarEsfera, estaAberta, truncar,
} from "@/lib/format"
import { Badge, StatusBadge } from "@/components/ui/Badge"
import {
  ExternalLink, FileText, Package,
  Calendar, Building2, MapPin, ChevronLeft, Clock,
} from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const parsed = parseContratacaoId(id)
  if (!parsed) return { title: "Licitação não encontrada" }
  try {
    const c = await buscarContratacao(parsed.cnpj, parsed.ano, parsed.seq)
    return {
      title: truncar(c.objetoCompra, 80) || `Contratação ${c.numeroControlePNCP}`,
      description: `${c.unidadeOrgao.nomeUnidade} — ${c.unidadeOrgao.municipioNome}/${c.unidadeOrgao.ufSigla}`,
    }
  } catch {
    return { title: "Licitação" }
  }
}

export default async function DetalheLicitacaoPage({ params }: Props) {
  const { id } = await params
  const parsed = parseContratacaoId(id)
  if (!parsed) notFound()

  const { cnpj, ano, seq } = parsed

  // Busca em paralelo: detalhe + itens + arquivos
  const [c, itens, arquivos] = await Promise.all([
    buscarContratacao(cnpj, ano, seq).catch(() => null),
    buscarItens(cnpj, ano, seq).catch(() => [] as Awaited<ReturnType<typeof buscarItens>>),
    buscarArquivos(cnpj, ano, seq).catch(() => [] as Awaited<ReturnType<typeof buscarArquivos>>),
  ])

  if (!c) notFound()

  const prazoAberto      = estaAberta(c.dataEncerramentoProposta)
  const situacaoAberta   = c.situacaoCompraId === 1
  const abertoConfirmado = situacaoAberta && prazoAberto

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 w-full">
      {/* Voltar */}
      <Link
        href="/licitacoes"
        className="flex items-center gap-1 text-sm mb-5 hover:underline w-fit"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft size={15} />
        Voltar para resultados
      </Link>

      {/* Cabeçalho */}
      <div
        className="rounded-2xl border bg-white p-5 mb-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-semibold leading-snug flex-1" style={{ color: "var(--navy)" }}>
            {c.objetoCompra || `Contratação ${c.numeroControlePNCP}`}
          </h1>
          <StatusBadge aberta={prazoAberto} confirmado={abertoConfirmado} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variante="navy">{c.modalidadeNome}</Badge>
          {c.modoDisputaNome  && <Badge variante="muted">{c.modoDisputaNome}</Badge>}
          {c.srp              && <Badge variante="info">SRP</Badge>}
          <Badge variante="muted">{formatarEsfera(c.orgaoEntidade.esferaId)}</Badge>
          {c.amparoLegal      && <Badge variante="muted">{c.amparoLegal.nome}</Badge>}
        </div>

        {/* Meta rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-2">
            <Building2 size={15} style={{ color: "var(--brand)", flexShrink: 0 }} />
            <span>{c.unidadeOrgao.nomeUnidade}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} style={{ color: "var(--brand)", flexShrink: 0 }} />
            <span>{c.unidadeOrgao.municipioNome} – {c.unidadeOrgao.ufSigla}</span>
          </div>
          {c.dataEncerramentoProposta && (
            <div className="flex items-center gap-2">
              <Clock size={15} style={{ color: prazoAberto ? "var(--success)" : "var(--text-muted)", flexShrink: 0 }} />
              <span>
                Encerra {formatarRelativo(c.dataEncerramentoProposta)}
                {" "}({formatarDataHora(c.dataEncerramentoProposta)})
              </span>
            </div>
          )}
          {c.dataAberturaProposta && (
            <div className="flex items-center gap-2">
              <Calendar size={15} style={{ flexShrink: 0 }} />
              <span>Abertura: {formatarDataHora(c.dataAberturaProposta)}</span>
            </div>
          )}
        </div>

        {/* Link para portal de origem */}
        {c.linkSistemaOrigem && (
          <a
            href={c.linkSistemaOrigem}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--brand)", color: "var(--navy)" }}
          >
            <ExternalLink size={14} />
            Ver no {c.usuarioNome ?? "portal de origem"}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Coluna principal ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Informações gerais */}
          <Secao titulo="Informações gerais">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Campo label="Número de controle PNCP" valor={c.numeroControlePNCP} />
              <Campo label="Processo"                valor={c.processo} />
              <Campo label="Número do edital"        valor={c.numeroCompra} />
              <Campo label="Situação"                valor={c.situacaoCompraNome} />
              <Campo label="Publicação PNCP"         valor={formatarData(c.dataPublicacaoPncp)} />
              <Campo label="Última atualização"      valor={formatarDataHora(c.dataAtualizacao)} />
              <Campo label="Instrumento"             valor={c.tipoInstrumentoConvocatorioNome} />
              <Campo label="Amparo legal"            valor={c.amparoLegal?.nome} />
            </dl>
          </Secao>

          {/* Objeto completo */}
          {c.informacaoComplementar && (
            <Secao titulo="Informação complementar">
              <p className="text-sm whitespace-pre-line" style={{ color: "var(--text-muted)" }}>
                {c.informacaoComplementar}
              </p>
            </Secao>
          )}

          {/* Itens */}
          {itens.length > 0 && (
            <Secao titulo={`Itens (${itens.length})`}>
              <div className="flex flex-col gap-2">
                {itens.map((item) => (
                  <div
                    key={item.numeroItem}
                    className="rounded-xl border p-3 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start gap-2">
                      <Package size={14} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-snug" style={{ color: "var(--navy)" }}>
                          {item.numeroItem}. {item.descricao || "Sem descrição"}
                        </p>
                        <div className="flex flex-wrap gap-x-4 mt-1" style={{ color: "var(--text-muted)" }}>
                          {item.quantidade != null && (
                            <span>{item.quantidade.toLocaleString("pt-BR")} {item.unidadeMedida ?? "un."}</span>
                          )}
                          {item.valorUnitarioEstimado != null && (
                            <span>Unit.: {formatarMoeda(item.valorUnitarioEstimado)}</span>
                          )}
                          {item.valorTotal != null && (
                            <span className="font-semibold">Total: {formatarMoeda(item.valorTotal)}</span>
                          )}
                          {item.materialOuServicoNome && (
                            <Badge variante="muted">{item.materialOuServicoNome}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Secao>
          )}

          {/* Documentos */}
          {arquivos.length > 0 && (
            <Secao titulo={`Documentos (${arquivos.length})`}>
              <div className="flex flex-col gap-2">
                {arquivos.filter((a) => a.statusAtivo).map((arq) => (
                  <a
                    key={arq.sequencialDocumento}
                    href={arq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors hover:bg-gray-50"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <FileText size={15} style={{ color: "var(--brand)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--navy)" }}>
                        {arq.titulo || "Documento"}
                      </p>
                      {arq.tipoDocumentoNome && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{arq.tipoDocumentoNome}</p>
                      )}
                    </div>
                    <ExternalLink size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </Secao>
          )}
        </div>

        {/* ─── Coluna lateral ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Valores */}
          <Secao titulo="Valores">
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Valor estimado total</dt>
                <dd className="font-semibold text-base tabular-nums" style={{ color: "var(--navy)" }}>
                  {c.indicadorOrcamentoSigiloso ? "Sigiloso" : formatarMoeda(c.valorTotalEstimado)}
                </dd>
              </div>
              {c.valorTotalHomologado != null && (
                <div>
                  <dt style={{ color: "var(--text-muted)" }}>Valor homologado</dt>
                  <dd className="font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
                    {formatarMoeda(c.valorTotalHomologado)}
                  </dd>
                </div>
              )}
            </dl>
          </Secao>

          {/* Órgão contratante */}
          <Secao titulo="Órgão contratante">
            <dl className="flex flex-col gap-2 text-sm">
              <Campo label="Razão social" valor={c.orgaoEntidade.razaoSocial} />
              <Campo label="CNPJ"         valor={c.orgaoEntidade.cnpj} />
              <Campo label="Esfera"       valor={formatarEsfera(c.orgaoEntidade.esferaId)} />
              <Campo label="Unidade"      valor={c.unidadeOrgao.nomeUnidade} />
              <Campo label="Código IBGE"  valor={c.unidadeOrgao.codigoIbge} />
            </dl>
          </Secao>

          {/* Portal de origem */}
          <Secao titulo="Origem dos dados">
            <dl className="flex flex-col gap-2 text-sm">
              <Campo label="Fonte"           valor="PNCP (Portal Nacional de Contratações Públicas)" />
              <Campo label="Sistema disputa" valor={c.usuarioNome} />
              <Campo label="Dados de"        valor={`consulta ao vivo em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`} />
            </dl>
            {c.linkSistemaOrigem && (
              <a
                href={c.linkSistemaOrigem}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1 text-xs hover:underline"
                style={{ color: "var(--brand-ink)" }}
              >
                <ExternalLink size={12} />
                Acessar portal de origem
              </a>
            )}
          </Secao>
        </div>
      </div>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border bg-white p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="font-semibold text-sm mb-3 pb-2" style={{ color: "var(--navy)", borderBottom: "1px solid var(--border)" }}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Campo({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className="font-medium mt-0.5" style={{ color: valor ? "var(--navy)" : "var(--text-light)" }}>
        {valor || "Não informado"}
      </dd>
    </div>
  )
}
