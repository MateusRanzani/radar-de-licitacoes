import "server-only"
import { db } from "@/db"
import { contratacoes, orgaos, unidadesOrgao } from "@/db/schema"
import { eq, sql, and, isNotNull, gt } from "drizzle-orm"
import { formatarMoeda } from "@/lib/format"
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

// Tetos art. 75 — Decreto 11.871/2023
// Verificar no decreto vigente do ano corrente antes de usar em produção
const TETO_BENS_SERVICOS  = 57_271.73   // art. 75, I  — bens e serviços em geral
const TETO_OBRAS          = 114_543.46  // art. 75, II — obras e serviços de engenharia

type Alerta = "critico" | "atencao" | "aviso" | "ok"

function classificar(pct: number): Alerta {
  if (pct >= 100) return "critico"
  if (pct >= 80)  return "atencao"
  if (pct >= 60)  return "aviso"
  return "ok"
}

export async function RadarFracionamento() {
  const anoAtual = new Date().getFullYear()

  // Soma dispensas por órgão no ano corrente (data_publicacao_pncp no fuso de Brasília)
  const rows = await db
    .select({
      orgaoId:       contratacoes.orgaoId,
      razaoSocial:   orgaos.razaoSocial,
      cnpj:          orgaos.cnpj,
      esfera:        orgaos.esfera,
      uf:            unidadesOrgao.ufSigla,
      totalDispensas: sql<string>`count(*)`,
      totalValor:    sql<string>`sum(${contratacoes.valorEstimado}::numeric)`,
    })
    .from(contratacoes)
    .innerJoin(orgaos,        eq(contratacoes.orgaoId,        orgaos.id))
    .leftJoin(unidadesOrgao,  eq(contratacoes.unidadeOrgaoId, unidadesOrgao.id))
    .where(
      and(
        eq(contratacoes.modalidadeId, 8), // Dispensa de Licitação
        isNotNull(contratacoes.dataPublicacaoPncp),
        gt(
          sql`extract(year from ${contratacoes.dataPublicacaoPncp} at time zone 'America/Sao_Paulo')`,
          sql`${anoAtual - 1}`,
        ),
        sql`extract(year from ${contratacoes.dataPublicacaoPncp} at time zone 'America/Sao_Paulo') = ${anoAtual}`,
      )
    )
    .groupBy(contratacoes.orgaoId, orgaos.razaoSocial, orgaos.cnpj, orgaos.esfera, unidadesOrgao.ufSigla)
    .orderBy(sql`sum(${contratacoes.valorEstimado}::numeric) desc nulls last`)
    .limit(20)

  const itens = rows
    .map((r) => {
      const valor = parseFloat(r.totalValor ?? "0")
      const total = parseInt(r.totalDispensas ?? "0", 10)
      const pct   = (valor / TETO_BENS_SERVICOS) * 100
      return { ...r, valor, total, pct, alerta: classificar(pct) }
    })
    .filter((r) => r.pct >= 30) // só mostra quem já consumiu ≥ 30% do teto

  const ESFERA: Record<string, string> = { F: "Federal", E: "Estadual", M: "Municipal", D: "Distrital" }

  const ALERTA_STYLE: Record<Alerta, { cor: string; bg: string; icon: React.ReactNode }> = {
    critico: {
      cor: "#B91C1C",
      bg:  "rgb(220 38 38 / 0.08)",
      icon: <AlertTriangle size={13} style={{ color: "#B91C1C" }} />,
    },
    atencao: {
      cor: "#B45309",
      bg:  "rgb(245 158 11 / 0.10)",
      icon: <AlertCircle size={13} style={{ color: "#B45309" }} />,
    },
    aviso: {
      cor: "#1D4ED8",
      bg:  "rgb(59 130 246 / 0.08)",
      icon: <AlertCircle size={13} style={{ color: "#1D4ED8" }} />,
    },
    ok: {
      cor: "#15803D",
      bg:  "rgb(34 197 94 / 0.08)",
      icon: <CheckCircle size={13} style={{ color: "#15803D" }} />,
    },
  }

  if (itens.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
        <h2 className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>
          Radar de Fracionamento — Dispensas {anoAtual}
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Acúmulo de dispensas (art. 75) por órgão no ano · Teto bens/serviços: {formatarMoeda(TETO_BENS_SERVICOS)} · Decreto 11.871/2023
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhum órgão consumiu mais de 30% do teto ainda este ano.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
      <h2 className="font-semibold text-sm mb-1" style={{ color: "var(--navy)" }}>
        Radar de Fracionamento — Dispensas {anoAtual}
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Acúmulo de dispensas (art. 75) por órgão · Teto bens/serviços: {formatarMoeda(TETO_BENS_SERVICOS)} ·{" "}
        obras: {formatarMoeda(TETO_OBRAS)} · Decreto 11.871/2023 — verificar decreto vigente
      </p>

      <div className="flex flex-col gap-2">
        {itens.map((r) => {
          const s = ALERTA_STYLE[r.alerta]
          const pctClamped = Math.min(r.pct, 100)
          return (
            <div
              key={r.orgaoId}
              className="rounded-xl p-3"
              style={{ background: s.bg, border: `1px solid ${s.cor}22` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {s.icon}
                  <span className="font-medium text-sm truncate" style={{ color: "var(--navy)" }}>
                    {r.razaoSocial}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: s.cor }}>
                  {r.pct.toFixed(0)}%
                </span>
              </div>

              <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pctClamped}%`, background: s.cor }}
                />
              </div>

              <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>
                  {r.total} dispensa{r.total !== 1 ? "s" : ""} ·{" "}
                  <span className="font-medium" style={{ color: "var(--navy)" }}>
                    {formatarMoeda(r.valor)}
                  </span>{" "}
                  de {formatarMoeda(TETO_BENS_SERVICOS)}
                </span>
                <span>{ESFERA[r.esfera ?? ""] ?? r.esfera ?? "—"}{r.uf ? ` · ${r.uf}` : ""}</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        ⚠ Fracionamento suspeito quando o mesmo objeto é dividido em várias dispensas para fugir do pregão.
        Valor total usa o teto de bens/serviços; obras têm teto maior. Verifique o objeto de cada dispensa.
      </p>
    </section>
  )
}
