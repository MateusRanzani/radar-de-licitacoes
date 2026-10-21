import type { Metadata } from "next"
import { connection } from "next/server"
import { Settings, CheckCircle2, XCircle, Loader2, Clock, Database } from "lucide-react"
import { db } from "@/db"
import { syncExecucoes, syncErros, fontes, contratacoes } from "@/db/schema"
import { desc, eq, count } from "drizzle-orm"

export const metadata: Metadata = { title: "Admin — LicitaRadar" }

export default async function AdminPage() {
  await connection()
  const [execucoes, totais, errosRecentes] = await Promise.all([
    db
      .select({
        id:               syncExecucoes.id,
        fonteSlug:        fontes.slug,
        status:           syncExecucoes.status,
        iniciadoEm:       syncExecucoes.iniciadoEm,
        concluidoEm:      syncExecucoes.concluidoEm,
        registrosLidos:   syncExecucoes.registrosLidos,
        registrosGravados: syncExecucoes.registrosGravados,
        erros:            syncExecucoes.erros,
        detalhes:         syncExecucoes.detalhes,
      })
      .from(syncExecucoes)
      .innerJoin(fontes, eq(syncExecucoes.fonteId, fontes.id))
      .orderBy(desc(syncExecucoes.iniciadoEm))
      .limit(20),

    db
      .select({ total: count() })
      .from(contratacoes),

    db
      .select({
        mensagem: syncErros.mensagem,
        criadoEm: syncErros.criadoEm,
        endpoint: syncErros.endpoint,
      })
      .from(syncErros)
      .orderBy(desc(syncErros.criadoEm))
      .limit(5),
  ])

  const totalContratacoes = totais[0]?.total ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgb(255 90 31 / 0.10)", color: "var(--brand)" }}
        >
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Admin</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Monitoramento de sync e banco de dados
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Contratações no DB"
          value={totalContratacoes.toLocaleString("pt-BR")}
          icon={<Database size={16} />}
        />
        <KpiCard
          label="Syncs executados"
          value={execucoes.length.toString()}
          icon={<Clock size={16} />}
        />
        <KpiCard
          label="Último status"
          value={execucoes[0]?.status ?? "—"}
          icon={execucoes[0]?.status === "concluido"
            ? <CheckCircle2 size={16} />
            : execucoes[0]?.status === "falha"
              ? <XCircle size={16} />
              : <Loader2 size={16} />}
        />
        <KpiCard
          label="Erros recentes"
          value={errosRecentes.length.toString()}
          icon={<XCircle size={16} />}
          alert={errosRecentes.length > 0}
        />
      </div>

      {/* Execuções */}
      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--navy)" }}>
          Histórico de sync
        </h2>
        {execucoes.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Nenhum sync executado ainda. Rode <code className="font-mono text-xs">npm run sync:pncp</code> para iniciar.
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    {["Fonte", "Status", "Início", "Duração", "Lidos", "Gravados", "Erros"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-xs" style={{ color: "var(--text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {execucoes.map((e, i) => {
                    const duracao = e.concluidoEm && e.iniciadoEm
                      ? Math.round((new Date(e.concluidoEm).getTime() - new Date(e.iniciadoEm).getTime()) / 1000)
                      : null
                    return (
                      <tr
                        key={String(e.id)}
                        style={{
                          borderBottom: i < execucoes.length - 1 ? "1px solid var(--border)" : undefined,
                          background: "white",
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs uppercase">{e.fonteSlug}</td>
                        <td className="px-4 py-3">
                          <StatusChip status={e.status} />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {new Date(e.iniciadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {duracao != null ? `${duracao}s` : "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{(e.registrosLidos ?? 0).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 tabular-nums">{(e.registrosGravados ?? 0).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: (e.erros ?? 0) > 0 ? "var(--danger)" : undefined }}>
                          {e.erros ?? 0}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Erros recentes */}
      {errosRecentes.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--navy)" }}>
            Erros recentes
          </h2>
          <div className="space-y-2">
            {errosRecentes.map((e, i) => (
              <div
                key={i}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: "var(--border)", background: "rgb(239 68 68 / 0.04)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>{e.mensagem}</p>
                {e.endpoint && (
                  <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>{e.endpoint}</p>
                )}
                <p className="text-xs mt-0.5" style={{ color: "var(--text-light)" }}>
                  {new Date(e.criadoEm!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instruções */}
      <section
        className="rounded-2xl border p-5 text-sm space-y-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Como sincronizar</h2>
        <div className="space-y-1" style={{ color: "var(--text-muted)" }}>
          <p><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--surface-glass)" }}>npm run sync:pncp</code> — sync completo (~17k propostas abertas, ~10min)</p>
          <p><code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--surface-glass)" }}>npm run sync:pncp -- --maxPags=5</code> — teste rápido (5 páginas)</p>
        </div>
      </section>
    </div>
  )
}

function KpiCard({ label, value, icon, alert }: {
  label: string; value: string; icon: React.ReactNode; alert?: boolean
}) {
  return (
    <div
      className="glass rounded-2xl p-4 flex flex-col gap-2"
      style={{ border: "1px solid var(--border-glass)" }}
    >
      <div className="flex items-center gap-1.5 text-xs" style={{ color: alert ? "var(--danger)" : "var(--text-muted)" }}>
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums" style={{ color: "var(--navy)" }}>{value}</p>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    concluido:  { label: "Concluído",  color: "var(--success)", bg: "rgb(16 185 129 / 0.10)" },
    executando: { label: "Executando", color: "var(--warning)", bg: "rgb(247 144 9 / 0.10)" },
    falha:      { label: "Falha",      color: "var(--danger)",  bg: "rgb(239 68 68 / 0.10)"  },
  }
  const s = map[status] ?? { label: status, color: "var(--text-muted)", bg: "var(--surface)" }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  )
}
