import { connection } from "next/server"
import { Suspense } from "react"
import type { Metadata } from "next"
import { db } from "@/db"
import {
  contratacoes, orgaos, unidadesOrgao, modalidades,
} from "@/db/schema"
import {
  eq, sql, count, sum, desc, isNotNull,
} from "drizzle-orm"
import { formatarMoeda } from "@/lib/format"
import { BarChart2, TrendingUp, Clock, Building2 } from "lucide-react"

export const metadata: Metadata = { title: "Painel BI" }

export default function PainelPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 w-full space-y-8">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgb(255 90 31 / 0.10)", color: "var(--brand)" }}
        >
          <BarChart2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Painel BI</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Análise do banco local</p>
        </div>
      </div>

      <Suspense fallback={<PainelCarregando />}>
        <PainelDados />
      </Suspense>
    </div>
  )
}

function PainelCarregando() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando painel">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />
      </div>
    </div>
  )
}

async function PainelDados() {
  await connection()

  const [
    kpis,
    porModalidade,
    porUf,
    porEsfera,
    recentes,
  ] = await Promise.all([
    // KPIs gerais
    db.select({
      total:         count(),
      totalAbertos:  sql<number>`count(*) filter (where ${contratacoes.statusDerivado} = 'aberta_confirmada')`,
      valorTotal:    sum(contratacoes.valorEstimado),
      valorAbertos:  sql<string>`sum(${contratacoes.valorEstimado}) filter (where ${contratacoes.statusDerivado} = 'aberta_confirmada')`,
    }).from(contratacoes),

    // Distribuição por modalidade
    db.select({
      nome:  modalidades.nome,
      total: count(),
      valor: sum(contratacoes.valorEstimado),
    })
      .from(contratacoes)
      .leftJoin(modalidades, eq(contratacoes.modalidadeId, modalidades.id))
      .groupBy(modalidades.nome)
      .orderBy(desc(count()))
      .limit(10),

    // Distribuição por UF
    db.select({
      uf:    unidadesOrgao.ufSigla,
      total: count(),
      valor: sum(contratacoes.valorEstimado),
    })
      .from(contratacoes)
      .innerJoin(unidadesOrgao, eq(contratacoes.unidadeOrgaoId, unidadesOrgao.id))
      .where(isNotNull(unidadesOrgao.ufSigla))
      .groupBy(unidadesOrgao.ufSigla)
      .orderBy(desc(count()))
      .limit(15),

    // Distribuição por esfera
    db.select({
      esfera: orgaos.esfera,
      total:  count(),
      valor:  sum(contratacoes.valorEstimado),
    })
      .from(contratacoes)
      .innerJoin(orgaos, eq(contratacoes.orgaoId, orgaos.id))
      .groupBy(orgaos.esfera)
      .orderBy(desc(count())),

    // 5 mais recentes
    db.select({
      objeto:           contratacoes.objeto,
      valorEstimado:    contratacoes.valorEstimado,
      orcamentoSigiloso: contratacoes.orcamentoSigiloso,
      dataPublicacaoPncp: contratacoes.dataPublicacaoPncp,
      orgaoNome:        orgaos.razaoSocial,
      unidadeUf:        unidadesOrgao.ufSigla,
      modalidadeNome:   modalidades.nome,
    })
      .from(contratacoes)
      .innerJoin(orgaos, eq(contratacoes.orgaoId, orgaos.id))
      .innerJoin(unidadesOrgao, eq(contratacoes.unidadeOrgaoId, unidadesOrgao.id))
      .leftJoin(modalidades, eq(contratacoes.modalidadeId, modalidades.id))
      .orderBy(desc(contratacoes.coletadoEm))
      .limit(5),
  ])

  const k = kpis[0]
  const totalNum    = k?.total    as unknown as number ?? 0
  const abertosNum  = k?.totalAbertos as number ?? 0
  const valorTotal  = k?.valorTotal  ? parseFloat(k.valorTotal as string) : null
  const valorAbertos = k?.valorAbertos ? parseFloat(k.valorAbertos as string) : null

  const maxModalidade = Math.max(1, ...porModalidade.map((m) => m.total as unknown as number))
  const maxUf         = Math.max(1, ...porUf.map((u) => u.total as unknown as number))

  const ESFERA: Record<string, string> = { F: "Federal", E: "Estadual", M: "Municipal", D: "Distrital" }

  return (
    <>
      <p className="text-sm -mt-5" style={{ color: "var(--text-muted)" }}>
        {totalNum.toLocaleString("pt-BR")} contratações indexadas
      </p>

      {totalNum === 0 && (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="font-medium" style={{ color: "var(--navy)" }}>Banco de dados vazio</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Execute <code className="font-mono text-xs">npm run sync:pncp</code> para importar dados do PNCP.
          </p>
        </div>
      )}

      {totalNum > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Total indexadas"
              valor={totalNum.toLocaleString("pt-BR")}
              icon={<BarChart2 size={16} />}
            />
            <KpiCard
              label="Abertas (conf.)"
              valor={abertosNum.toLocaleString("pt-BR")}
              icon={<Clock size={16} />}
              destaque
            />
            <KpiCard
              label="Valor total estimado"
              valor={valorTotal ? formatarMoeda(valorTotal) : "—"}
              icon={<TrendingUp size={16} />}
            />
            <KpiCard
              label="Valor em aberto"
              valor={valorAbertos ? formatarMoeda(valorAbertos) : "—"}
              icon={<TrendingUp size={16} />}
              destaque
            />
          </div>

          {/* Linha: modalidade + esfera */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por modalidade */}
            <Secao titulo="Por modalidade (top 10)">
              <div className="flex flex-col gap-2">
                {porModalidade.map((m) => {
                  const total = m.total as unknown as number
                  const pct = Math.round((total / maxModalidade) * 100)
                  return (
                    <div key={m.nome ?? "—"} className="flex items-center gap-2 text-sm">
                      <span className="w-40 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {m.nome ?? "Não informada"}
                      </span>
                      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: "var(--brand)" }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums text-xs font-medium" style={{ color: "var(--navy)" }}>
                        {total.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Secao>

            {/* Por esfera */}
            <Secao titulo="Por esfera de governo">
              <div className="flex flex-col gap-3">
                {porEsfera.map((e) => {
                  const total = e.total as unknown as number
                  const pctTotal = totalNum > 0 ? Math.round((total / totalNum) * 100) : 0
                  return (
                    <div key={e.esfera ?? "—"} className="flex items-center gap-3">
                      <span className="w-24 text-sm" style={{ color: "var(--text-muted)" }}>
                        {ESFERA[e.esfera ?? ""] ?? e.esfera ?? "—"}
                      </span>
                      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pctTotal}%`, background: pctTotal > 50 ? "var(--navy)" : "var(--brand)" }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                        {total.toLocaleString("pt-BR")} ({pctTotal}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </Secao>
          </div>

          {/* Por UF */}
          <Secao titulo="Por estado (top 15)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {porUf.map((u) => {
                const total = u.total as unknown as number
                const pct = Math.round((total / maxUf) * 100)
                return (
                  <div key={u.uf ?? "—"} className="flex items-center gap-2 text-sm">
                    <span className="w-8 font-mono text-xs font-semibold" style={{ color: "var(--navy)" }}>
                      {u.uf ?? "—"}
                    </span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "var(--brand)" }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                      {total.toLocaleString("pt-BR")}
                    </span>
                  </div>
                )
              })}
            </div>
          </Secao>

          {/* Mais recentes */}
          <Secao titulo="Adicionadas recentemente">
            <div className="flex flex-col gap-2">
              {recentes.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="font-medium line-clamp-1" style={{ color: "var(--navy)" }}>
                    {r.objeto ?? "Sem objeto"}
                  </p>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Building2 size={11} />
                      {r.orgaoNome}
                    </span>
                    <span>{r.unidadeUf}</span>
                    <span>{r.modalidadeNome ?? "—"}</span>
                    <span className="font-semibold" style={{ color: "var(--navy)" }}>
                      {r.orcamentoSigiloso ? "Sigiloso" : formatarMoeda(r.valorEstimado ? parseFloat(r.valorEstimado) : null)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Secao>
        </>
      )}
    </>
  )
}

function KpiCard({ label, valor, icon, destaque }: {
  label: string; valor: string; icon: React.ReactNode; destaque?: boolean
}) {
  return (
    <div
      className="glass rounded-2xl p-4 flex flex-col gap-2 min-w-0"
      style={{ border: "1px solid var(--border-glass)" }}
    >
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        {icon}
        {label}
      </div>
      <p
        className={`${valor.length > 12 ? "text-lg" : "text-2xl"} font-semibold tabular-nums leading-tight`}
        style={{ color: destaque ? "var(--brand)" : "var(--navy)" }}
      >
        {valor}
      </p>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--navy)" }}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
