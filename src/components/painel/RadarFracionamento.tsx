import "server-only"
import { connection } from "next/server"
import { db } from "@/db"
import { contratacoes, orgaos, unidadesOrgao } from "@/db/schema"
import { eq, sql, and, isNotNull } from "drizzle-orm"
import { formatarMoeda } from "@/lib/format"
import { agruparPorObjeto } from "@/lib/fracionamento"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import { BotaoAjuda } from "@/components/tour/BotaoAjuda"

// Tetos art. 75 — Decreto 11.871/2023. Verificar o decreto vigente do ano.
const TETO_BENS_SERVICOS = 57_271.73   // art. 75, I  — bens e serviços em geral
const TETO_OBRAS         = 114_543.46  // art. 75, II — obras e engenharia

// Calibrado contra as 113 dispensas de 2026 da Prefeitura de Franca: abaixo
// disso chamadas públicas distintas se fundem; acima, variações de redação do
// mesmo objeto se separam.
const LIMIAR_SIMILARIDADE = 0.5
// Uma dispensa isolada acima do teto é outro problema, não fracionamento.
const MIN_DISPENSAS = 2
const MAX_LINHAS = 1_500

type Alerta = "critico" | "atencao" | "aviso"

function classificar(pct: number): Alerta {
  if (pct >= 300) return "critico"
  if (pct >= 150) return "atencao"
  return "aviso"
}

const ESTILO: Record<Alerta, { cor: string; bg: string }> = {
  critico: { cor: "#B91C1C", bg: "rgb(220 38 38 / 0.08)" },
  atencao: { cor: "#B45309", bg: "rgb(245 158 11 / 0.10)" },
  aviso:   { cor: "#1D4ED8", bg: "rgb(59 130 246 / 0.08)" },
}

export async function RadarFracionamento() {
  await connection()
  const anoAtual = new Date().getFullYear()

  const rows = await db
    .select({
      orgaoId:     contratacoes.orgaoId,
      razaoSocial: orgaos.razaoSocial,
      uf:          unidadesOrgao.ufSigla,
      objeto:      contratacoes.objeto,
      valor:       sql<string>`coalesce(${contratacoes.valorEstimado}::numeric, 0)`,
    })
    .from(contratacoes)
    .innerJoin(orgaos, eq(contratacoes.orgaoId, orgaos.id))
    .leftJoin(unidadesOrgao, eq(contratacoes.unidadeOrgaoId, unidadesOrgao.id))
    .where(
      and(
        eq(contratacoes.modalidadeId, 8),
        isNotNull(contratacoes.objeto),
        isNotNull(contratacoes.dataPublicacaoPncp),
        sql`extract(year from ${contratacoes.dataPublicacaoPncp} at time zone 'America/Sao_Paulo') = ${anoAtual}`,
      ),
    )
    .limit(MAX_LINHAS)

  // Agrupa por órgão: o teto é aferido dentro de cada órgão, não entre eles
  const porOrgao = new Map<number, typeof rows>()
  for (const r of rows) {
    if (r.orgaoId == null) continue
    const atual = porOrgao.get(r.orgaoId)
    if (atual) atual.push(r)
    else porOrgao.set(r.orgaoId, [r])
  }

  const grupos = []
  for (const itens of porOrgao.values()) {
    for (const cluster of agruparPorObjeto(itens, (i) => i.objeto ?? "", LIMIAR_SIMILARIDADE)) {
      if (cluster.length < MIN_DISPENSAS) continue
      const soma = cluster.reduce((a, c) => a + parseFloat(c.valor), 0)
      if (soma < TETO_BENS_SERVICOS) continue
      grupos.push({
        razaoSocial: cluster[0].razaoSocial,
        uf:          cluster[0].uf,
        objeto:      cluster[0].objeto ?? "Não informado",
        n:           cluster.length,
        soma,
        pct:         (soma / TETO_BENS_SERVICOS) * 100,
      })
    }
  }
  grupos.sort((a, b) => b.soma - a.soma)

  const cabecalho = (
    <div className="flex items-center justify-between gap-2 mb-1">
      <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
        Dispensas com objeto recorrente — {anoAtual}
      </h2>
      <BotaoAjuda tourId="fracionamento" rotulo="Como funciona o Radar de Fracionamento" />
    </div>
  )

  if (rows.length === 0) {
    return (
      <section id="tour-radar-fracionamento" className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
        {cabecalho}
        <p id="tour-radar-explicacao" className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Agrupa dispensas de objeto semelhante dentro de cada órgão e soma os valores.
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhuma dispensa de {anoAtual} no banco. Rode{" "}
          <code className="font-mono text-xs">npm run sync:dispensas</code> para carregar o
          histórico dos órgãos monitorados.
        </p>
      </section>
    )
  }

  return (
    <section id="tour-radar-fracionamento" className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
      {cabecalho}
      <p id="tour-radar-explicacao" className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Dispensas de objeto semelhante somadas por órgão, comparadas ao teto do art. 75:{" "}
        {formatarMoeda(TETO_BENS_SERVICOS)} para bens/serviços e {formatarMoeda(TETO_OBRAS)} para
        obras (Decreto 11.871/2023) · {rows.length} dispensa{rows.length !== 1 ? "s" : ""} analisada
        {rows.length !== 1 ? "s" : ""}
      </p>

      {grupos.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhum conjunto de dispensas de objeto semelhante ultrapassou o teto este ano.
        </p>
      ) : (
        <div id="tour-radar-lista" className="flex flex-col gap-2">
          {grupos.map((g, idx) => {
            const s = ESTILO[classificar(g.pct)]
            return (
              <div
                key={idx}
                id={idx === 0 ? "tour-radar-item" : undefined}
                className="rounded-xl p-3"
                style={{ background: s.bg, border: `1px solid ${s.cor}22` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {g.pct >= 300
                      ? <AlertTriangle size={13} style={{ color: s.cor }} />
                      : <AlertCircle size={13} style={{ color: s.cor }} />}
                    <span className="font-medium text-sm truncate" style={{ color: "var(--navy)" }}>
                      {g.razaoSocial}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: s.cor }}>
                    {g.pct.toFixed(0)}% do teto
                  </span>
                </div>

                <p className="mt-1 text-xs leading-snug line-clamp-2" style={{ color: "var(--text-muted)" }}>
                  {g.objeto}
                </p>

                <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>
                    {g.n} dispensas de objeto semelhante ·{" "}
                    <span className="font-medium" style={{ color: "var(--navy)" }}>
                      {formatarMoeda(g.soma)}
                    </span>{" "}
                    de {formatarMoeda(TETO_BENS_SERVICOS)}
                  </span>
                  {g.uf && <span>{g.uf}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div
        className="mt-3 flex items-start gap-1.5 rounded-xl p-2.5 text-xs"
        style={{ background: "var(--surface)", color: "var(--text-muted)" }}
      >
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          Recorrência é indício a verificar, não irregularidade. Há hipóteses legais que explicam
          objeto repetido — chamada pública da agricultura familiar (PNAE), emergência e dispensas
          de naturezas distintas agrupadas por semelhança de texto. Confira o objeto de cada
          dispensa no PNCP antes de concluir.
        </span>
      </div>
    </section>
  )
}
