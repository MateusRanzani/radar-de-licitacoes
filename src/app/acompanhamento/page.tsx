import { redirect } from "next/navigation"
import { connection } from "next/server"
import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/db"
import {
  favoritos, anotacoes, statusPessoal,
  contratacoes, orgaos, unidadesOrgao, modalidades,
} from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { formatarMoeda, formatarData, formatarRelativo, estaAberta } from "@/lib/format"
import { StatusBadge } from "@/components/ui/Badge"
import { AnotacaoEditor } from "@/components/acompanhamento/AnotacaoEditor"
import { StatusSelector } from "@/components/acompanhamento/StatusSelector"
import { Star, Calendar, Building2, MapPin, ExternalLink } from "lucide-react"

export const metadata: Metadata = { title: "Acompanhamento" }


export default async function AcompanhamentoPage() {
  await connection()
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  // Busca favoritos com dados da contratação
  const favoritosComDados = await db
    .select({
      favoritoId:    favoritos.id,
      contratacaoId: favoritos.contratacaoId,
      favoritadoEm:  favoritos.criadoEm,
      objeto:        contratacoes.objeto,
      numero:        contratacoes.numero,
      numeroControlePncp: contratacoes.numeroControlePncp,
      valorEstimado: contratacoes.valorEstimado,
      orcamentoSigiloso: contratacoes.orcamentoSigiloso,
      situacaoId:    contratacoes.situacaoId,
      dataEncerramentoProposta: contratacoes.dataEncerramentoProposta,
      orgaoNome:     orgaos.razaoSocial,
      unidadeNome:   unidadesOrgao.nome,
      unidadeUf:     unidadesOrgao.ufSigla,
      unidadeMunicipio: unidadesOrgao.municipioNome,
      modalidadeNome: modalidades.nome,
    })
    .from(favoritos)
    .innerJoin(contratacoes, eq(favoritos.contratacaoId, contratacoes.id))
    .innerJoin(orgaos, eq(contratacoes.orgaoId, orgaos.id))
    .innerJoin(unidadesOrgao, eq(contratacoes.unidadeOrgaoId, unidadesOrgao.id))
    .leftJoin(modalidades, eq(contratacoes.modalidadeId, modalidades.id))
    .where(eq(favoritos.userId, userId))
    .orderBy(desc(favoritos.criadoEm))
    .limit(50)

  // Anotações e status para esses favoritos
  const ids = favoritosComDados.map((f) => f.contratacaoId)

  const [anotacoesMap, statusMap] = await Promise.all([
    ids.length > 0
      ? db.select().from(anotacoes).where(eq(anotacoes.userId, userId))
      : Promise.resolve([]),
    ids.length > 0
      ? db.select().from(statusPessoal).where(eq(statusPessoal.userId, userId))
      : Promise.resolve([]),
  ])

  const anotacaoPorId = Object.fromEntries(
    anotacoesMap.map((a) => [String(a.contratacaoId), a.conteudo]),
  )
  const statusPorId = Object.fromEntries(
    statusMap.map((s) => [String(s.contratacaoId), s.status]),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>
          Acompanhamento
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {session.user.name} · {favoritosComDados.length} licitaç{favoritosComDados.length !== 1 ? "ões" : "ão"} salv{favoritosComDados.length !== 1 ? "as" : "a"}
        </p>
      </div>

      {favoritosComDados.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-2xl border p-12 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <Star size={36} style={{ color: "var(--text-light)" }} />
          <div>
            <p className="font-medium text-lg" style={{ color: "var(--navy)" }}>
              Nenhuma licitação salva
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Busque licitações e clique no ícone de estrela para acompanhar.
            </p>
          </div>
          <Link
            href="/licitacoes"
            className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--brand)", color: "var(--navy)" }}
          >
            Buscar licitações
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {favoritosComDados.map((fav) => {
            const prazoAberto = estaAberta(
              fav.dataEncerramentoProposta?.toISOString().slice(0, 19) ?? null,
            )
            const situacaoAberta = fav.situacaoId === 1
            const abertoConfirmado = situacaoAberta && prazoAberto
            const cid = String(fav.contratacaoId)
            const statusAtual = statusPorId[cid]
            const anotacaoAtual = anotacaoPorId[cid]

            return (
              <article
                key={cid}
                className="rounded-2xl border bg-white p-5"
                style={{ borderColor: "var(--border)" }}
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                      {fav.modalidadeNome ?? "—"}
                    </p>
                    <p className="font-semibold text-[15px] leading-snug mt-0.5" style={{ color: "var(--navy)" }}>
                      {fav.objeto ?? `Contratação ${fav.numeroControlePncp}`}
                    </p>
                  </div>
                  <StatusBadge aberta={prazoAberto} confirmado={abertoConfirmado} />
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {fav.unidadeNome}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {fav.unidadeMunicipio} – {fav.unidadeUf}
                  </span>
                  {fav.dataEncerramentoProposta && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Encerra {formatarRelativo(fav.dataEncerramentoProposta.toISOString())}
                      {" "}({formatarData(fav.dataEncerramentoProposta.toISOString())})
                    </span>
                  )}
                  <span className="font-semibold" style={{ color: "var(--navy)" }}>
                    {fav.orcamentoSigiloso ? "Sigiloso" : formatarMoeda(fav.valorEstimado ? parseFloat(fav.valorEstimado) : null)}
                  </span>
                </div>

                {/* Status pipeline */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Status:</span>
                  <StatusSelector
                    contratacaoId={fav.contratacaoId}
                    statusAtual={statusAtual ?? null}
                  />
                </div>

                {/* Anotação */}
                <AnotacaoEditor
                  contratacaoId={fav.contratacaoId}
                  conteudoInicial={anotacaoAtual ?? ""}
                />

                {/* Rodapé */}
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[11px]" style={{ color: "var(--text-light)" }}>
                    Salvo em {formatarData(fav.favoritadoEm.toISOString())} · {fav.numeroControlePncp}
                  </span>
                  {fav.numeroControlePncp && (
                    <Link
                      href={`https://pncp.gov.br/app/editais/${fav.numeroControlePncp.split("-")[0]}/${fav.numeroControlePncp.split("/")[1]}/${parseInt(fav.numeroControlePncp.split("/")[0].split("-").pop() ?? "0")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] hover:underline"
                      style={{ color: "var(--brand-ink)" }}
                    >
                      <ExternalLink size={12} />
                      PNCP
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
