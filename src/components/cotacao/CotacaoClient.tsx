"use client"

import { useState, useRef, useMemo, useCallback } from "react"
import {
  Search, AlertTriangle, RotateCw, ExternalLink, Scissors, X, Bot, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react"
import {
  buscarPrecos, grupoUnidade, type PrecoCotacao, type FiltrosCotacao, type Progresso,
} from "@/lib/cotacao/pncp-precos"
import {
  calcularEstatisticas, paraUnidades, formatarPrecoUnitario, formatarPrecoResumido, sugerirDescarte,
  type Estatisticas,
} from "@/lib/cotacao/estatistica"
import { formatarData } from "@/lib/format"
import { PainelMapa, RankingUf } from "@/components/cotacao/MapaBrasil"

type Fase  = "form" | "buscando" | "pronto" | "erro"
type Ordem = "data" | "preco-asc" | "preco-desc"

interface Estado {
  fase:      Fase
  progresso: Progresso
  precos:    PrecoCotacao[]
  excluidos: Set<string>
  motivos:   Map<string, string>   // ID → motivo do descarte sugerido
  erro:      string | null
  cancelado: boolean
}

const PROGRESSO_INICIAL: Progresso = { mensagem: "", analisadas: 0, total: 0 }

const ESTADO_INICIAL: Estado = {
  fase: "form", progresso: PROGRESSO_INICIAL, precos: [], excluidos: new Set(), motivos: new Map(),
  erro: null, cancelado: false,
}

function contarPor<T>(lista: T[], chave: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of lista) { const k = chave(t); m.set(k, (m.get(k) ?? 0) + 1) }
  return m
}

function grupoMaisPopuloso(precos: PrecoCotacao[]): string | null {
  const [primeiro] = [...contarPor(precos, (p) => grupoUnidade(p.unidade))].sort((a, b) => b[1] - a[1])
  return primeiro?.[0] ?? null
}

// ─── Componente principal ─────────────────────────────────────────────────── //

export function CotacaoClient() {
  const [estado, setEstado]     = useState<Estado>(ESTADO_INICIAL)
  const [q, setQ]               = useState("")
  const [meses, setMeses]       = useState(12)
  const [grupo, setGrupo]       = useState<string | null>(null)
  const [ufFiltro, setUfFiltro] = useState<string | null>(null)
  const [ordem, setOrdem]       = useState<Ordem>("data")
  const ctrlRef                 = useRef<AbortController | null>(null)

  const grupos = useMemo(
    () => [...contarPor(estado.precos, (p) => grupoUnidade(p.unidade))].sort((a, b) => b[1] - a[1]),
    [estado.precos],
  )

  const precosGrupo = useMemo(
    () => (grupo ? estado.precos.filter((p) => grupoUnidade(p.unidade) === grupo) : estado.precos),
    [estado.precos, grupo],
  )

  const contadoresUf = useMemo(
    () => contarPor(estado.fase === "buscando" ? estado.precos : precosGrupo, (p) => p.uf),
    [estado.fase, estado.precos, precosGrupo],
  )

  const visiveis = useMemo(() => {
    const lista = ufFiltro ? precosGrupo.filter((p) => p.uf === ufFiltro) : [...precosGrupo]
    if (ordem === "preco-asc")  return lista.sort((a, b) => a.valorUnitario - b.valorUnitario)
    if (ordem === "preco-desc") return lista.sort((a, b) => b.valorUnitario - a.valorUnitario)
    return lista.sort((a, b) => (a.dataResultado < b.dataResultado ? 1 : -1))
  }, [precosGrupo, ufFiltro, ordem])

  const incluidos = useMemo(
    () => visiveis.filter((p) => !estado.excluidos.has(p.id)),
    [visiveis, estado.excluidos],
  )

  const estatisticas = useMemo(
    () => calcularEstatisticas(incluidos.map((p) => paraUnidades(p.valorUnitario))),
    [incluidos],
  )

  // ─── Busca ─────────────────────────────────────────────────────────────── //

  const iniciarBusca = useCallback(async () => {
    if (!q.trim()) return

    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl

    setEstado({ ...ESTADO_INICIAL, fase: "buscando", progresso: { ...PROGRESSO_INICIAL, mensagem: "Iniciando…" } })
    setGrupo(null)
    setUfFiltro(null)
    setOrdem("data")

    const filtros: FiltrosCotacao = { q: q.trim(), meses }

    try {
      const precos = await buscarPrecos(
        filtros,
        ctrl.signal,
        (progresso) => { if (!ctrl.signal.aborted) setEstado((prev) => ({ ...prev, progresso })) },
        (preco) => { if (!ctrl.signal.aborted) setEstado((prev) => ({ ...prev, precos: [...prev.precos, preco] })) },
      )
      if (ctrl.signal.aborted) return
      setEstado({ ...ESTADO_INICIAL, fase: "pronto", precos })
      setGrupo(grupoMaisPopuloso(precos))
    } catch (err) {
      if (ctrl.signal.aborted) return
      setEstado({ ...ESTADO_INICIAL, fase: "erro", erro: err instanceof Error ? err.message : String(err) })
    }
  }, [q, meses])

  const cancelar = useCallback(() => {
    ctrlRef.current?.abort()
    const parciais = estado.precos
    setEstado({ ...ESTADO_INICIAL, fase: parciais.length > 0 ? "pronto" : "form", precos: parciais, cancelado: true })
    setGrupo(grupoMaisPopuloso(parciais))
  }, [estado.precos])

  // ─── Seleção ──────────────────────────────────────────────────────────── //

  const toggle = useCallback((id: string) => {
    setEstado((prev) => {
      const excluidos = new Set(prev.excluidos)
      const motivos   = new Map(prev.motivos)
      if (excluidos.has(id)) { excluidos.delete(id); motivos.delete(id) } else excluidos.add(id)
      return { ...prev, excluidos, motivos }
    })
  }, [])

  const incluirVisiveis = useCallback(() => {
    setEstado((prev) => {
      const excluidos = new Set(prev.excluidos)
      const motivos   = new Map(prev.motivos)
      for (const p of visiveis) { excluidos.delete(p.id); motivos.delete(p.id) }
      return { ...prev, excluidos, motivos }
    })
  }, [visiveis])

  const excluirVisiveis = useCallback(() => {
    setEstado((prev) => {
      const excluidos = new Set(prev.excluidos)
      for (const p of visiveis) excluidos.add(p.id)
      return { ...prev, excluidos }
    })
  }, [visiveis])

  const aplicarSaneamento = useCallback(() => {
    const sugestoes = sugerirDescarte(incluidos.map((p) => ({ id: p.id, valor: paraUnidades(p.valorUnitario) })))
    if (sugestoes.length === 0) return
    setEstado((prev) => {
      const excluidos = new Set(prev.excluidos)
      const motivos   = new Map(prev.motivos)
      for (const s of sugestoes) { excluidos.add(s.id); motivos.set(s.id, s.motivo) }
      return { ...prev, excluidos, motivos }
    })
  }, [incluidos])

  const escolherGrupo = (g: string | null) => { setGrupo(g); setUfFiltro(null) }

  // ─── Render ───────────────────────────────────────────────────────────── //

  const buscando = estado.fase === "buscando"

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => { e.preventDefault(); iniciarBusca() }}
        className="flex flex-col gap-3"
        role="search"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-light)" }}
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex.: dipirona, seringa, notebook…"
              aria-label="Produto para cotar"
              className="h-11 w-full rounded-xl border pl-10 pr-3 text-[15px] bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}
              disabled={buscando}
            />
          </div>
          <button
            type="submit"
            disabled={!q.trim() || buscando}
            className="h-11 px-5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--brand)", color: "var(--navy)" }}
          >
            {buscando ? "Buscando…" : "Buscar preços"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>Período:</span>
          {([3, 6, 12, 24] as const).map((m) => (
            <Chip key={m} ativo={meses === m} onClick={() => setMeses(m)} disabled={buscando}>
              {m} meses
            </Chip>
          ))}
          <span className="text-xs" style={{ color: "var(--text-light)" }}>
            art. 5º II da IN SEGES 65/2021 — prioridade para o último ano
          </span>
        </div>
      </form>

      {buscando && (
        <PainelMapa
          titulo="Rastreando preços no PNCP"
          subtitulo={`Compras homologadas com “${q.trim()}” nos últimos ${meses} meses`}
          contadores={contadoresUf}
          buscando
          ufSelecionada={null}
          onClickUf={() => {}}
          lateral={<ProgressoBusca progresso={estado.progresso} precos={estado.precos} onCancelar={cancelar} />}
        />
      )}

      {estado.fase === "erro" && (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border p-8 text-center"
          style={{ borderColor: "var(--danger)", background: "rgb(240 68 56 / 0.04)" }}
          role="alert"
        >
          <AlertTriangle size={28} style={{ color: "var(--danger)" }} />
          <p className="font-medium" style={{ color: "var(--danger)" }}>Não foi possível consultar o PNCP</p>
          <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>{estado.erro}</p>
          <button
            onClick={iniciarBusca}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold mt-1"
            style={{ background: "var(--brand)", color: "var(--navy)" }}
          >
            <RotateCw size={14} /> Tentar de novo
          </button>
        </div>
      )}

      {estado.fase === "pronto" && estado.precos.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-white p-10 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="font-medium" style={{ color: "var(--navy)" }}>Nenhum preço homologado encontrado</p>
          <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
            Tente ampliar o período ou usar outra palavra-chave (ex.: nome do princípio ativo).
          </p>
        </div>
      )}

      {estado.fase === "pronto" && estado.precos.length > 0 && (
        <PainelMapa
          titulo="Preços homologados por estado"
          subtitulo={`${grupo ? `Apresentação: ${grupo}` : "Todas as apresentações"} · clique em um estado para filtrar a tabela`}
          contadores={contadoresUf}
          buscando={false}
          ufSelecionada={ufFiltro}
          onClickUf={setUfFiltro}
          lateral={
            <>
              <RankingUf contadores={contadoresUf} ufSelecionada={ufFiltro} onClickUf={setUfFiltro} />
              <PainelResumo estatisticas={estatisticas} total={visiveis.length} />
            </>
          }
        />
      )}

      {estado.fase === "pronto" && estado.precos.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {estado.cancelado && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgb(247 144 9 / 0.10)", color: "#92400E" }}>
                Busca cancelada — exibindo os {estado.precos.length} preços encontrados até a interrupção.
              </p>
            )}

            {grupos.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Apresentação:</span>
                {grupos.map(([g, n]) => (
                  <Chip key={g} ativo={grupo === g} onClick={() => escolherGrupo(g)}>
                    {g} <span style={{ color: "var(--text-light)" }}>({n})</span>
                  </Chip>
                ))}
                <Chip ativo={grupo === null} onClick={() => escolherGrupo(null)}>
                  Todas ({estado.precos.length})
                </Chip>
              </div>
            )}

            {grupo === null && grupos.length > 1 && (
              <p className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-2" style={{ background: "rgb(247 144 9 / 0.10)", color: "#92400E" }}>
                <AlertTriangle size={13} className="shrink-0" />
                Misturar apresentações diferentes distorce a média. Selecione uma apresentação.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {ufFiltro && (
                <span
                  className="flex items-center gap-1 h-7 pl-3 pr-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "var(--navy)", color: "white" }}
                >
                  UF: {ufFiltro}
                  <button
                    onClick={() => setUfFiltro(null)}
                    className="rounded p-0.5 hover:bg-white/15"
                    aria-label="Remover filtro de estado"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <BotaoAcao onClick={incluirVisiveis}>Incluir todos</BotaoAcao>
              <BotaoAcao onClick={excluirVisiveis}>Excluir todos</BotaoAcao>
              <BotaoAcao
                onClick={aplicarSaneamento}
                disabled={incluidos.length < 3}
                title="Exclui valores abaixo de 70% ou acima de 130% da média — o descarte precisa ser justificado no processo"
              >
                <Scissors size={12} /> Sugerir descarte
              </BotaoAcao>
              <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--text-muted)" }}>
                {incluidos.length} de {visiveis.length} incluídos
              </span>
            </div>

            <TabelaPrecos
              precos={visiveis}
              excluidos={estado.excluidos}
              motivos={estado.motivos}
              ordem={ordem}
              onOrdem={setOrdem}
              onToggle={toggle}
            />

            <p className="text-[11px]" style={{ color: "var(--text-light)" }}>
              Fonte: PNCP (busca não oficial + API de itens/resultados) · consultado do seu navegador em{" "}
              {new Date(estado.precos[0].consultadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · nada é armazenado
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Coluna de progresso do "robô" (fundo escuro) ────────────────────────── //

function ProgressoBusca({
  progresso, precos, onCancelar,
}: {
  progresso: Progresso
  precos: PrecoCotacao[]
  onCancelar: () => void
}) {
  const pct = progresso.total > 0 ? Math.round((progresso.analisadas / progresso.total) * 100) : null
  const recentes = precos.slice(-5).reverse()
  const caixa = { background: "rgb(255 255 255 / 0.04)", border: "1px solid #2B4469" }

  return (
    <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .barra-ind { animation: barra-ind 1.4s ease-in-out infinite; }
          .feed-in   { animation: feed-in .35s ease-out; }
          .bot-ping  { animation: bot-ping 1.6s ease-out infinite; }
        }
        @keyframes barra-ind { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        @keyframes feed-in   { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        @keyframes bot-ping  { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
      `}</style>

      <div className="rounded-xl px-4 py-3 flex flex-col gap-3" style={caixa}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--brand)" }}>
            <span className="bot-ping absolute inset-0 rounded-xl" style={{ background: "var(--brand)" }} aria-hidden="true" />
            <Bot size={18} className="relative" style={{ color: "var(--navy)" }} />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs" style={{ color: "#CBD5E1" }} title={progresso.mensagem}>
            {progresso.mensagem}
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#1E3150" }}>
          {pct === null ? (
            <div className="barra-ind h-full w-2/5 rounded-full" style={{ background: "var(--brand)" }} />
          ) : (
            <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: "var(--brand)" }} />
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] tabular-nums" style={{ color: "#94A3B8" }}>
            {progresso.total > 0
              ? `${progresso.analisadas} de ${progresso.total} compras analisadas`
              : "Localizando compras com resultado…"}
          </p>
          <button
            onClick={onCancelar}
            className="h-7 px-3 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
            style={{ border: "1px solid #2B4469", color: "#E2E8F0" }}
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="rounded-xl px-3 py-3 flex flex-col gap-2" style={caixa}>
        <p className="px-1 text-xs font-semibold text-white">Últimos encontrados</p>
        {recentes.length === 0 ? (
          <p className="px-1 text-xs" style={{ color: "#64748B" }}>Nenhum preço ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentes.map((p) => (
              <li key={p.id} className="feed-in flex items-center gap-2 rounded-lg px-1 py-1 text-xs">
                <span className="w-6 shrink-0 font-bold" style={{ color: "#FDBA74" }}>{p.uf}</span>
                <span className="shrink-0 font-semibold tabular-nums text-white">{formatarPrecoUnitario(p.valorUnitario)}</span>
                <span className="truncate" style={{ color: "#94A3B8" }} title={p.descricao}>{p.descricao}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px]" style={{ color: "#64748B" }}>
        Cancele a qualquer momento para usar o que já foi encontrado.
      </p>
    </div>
  )
}

// ─── Tabela ──────────────────────────────────────────────────────────────── //

function TabelaPrecos({
  precos, excluidos, motivos, ordem, onOrdem, onToggle,
}: {
  precos: PrecoCotacao[]
  excluidos: Set<string>
  motivos: Map<string, string>
  ordem: Ordem
  onOrdem: (o: Ordem) => void
  onToggle: (id: string) => void
}) {
  if (precos.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        Nenhum preço com esse filtro.
      </div>
    )
  }

  const IconePreco = ordem === "preco-asc" ? ArrowUp : ordem === "preco-desc" ? ArrowDown : ArrowUpDown
  const th = "px-3 py-2.5 text-xs font-medium"

  return (
    <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "var(--border)" }}>
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-10" />
          <col className="w-32" />
          <col />
          <col className="w-[32%]" />
          <col className="w-24" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr style={{ background: "var(--canvas)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <th className={th}><span className="sr-only">Incluir</span></th>
            <th className={`${th} text-right`} aria-sort={ordem === "preco-asc" ? "ascending" : ordem === "preco-desc" ? "descending" : "none"}>
              <button
                onClick={() => onOrdem(ordem === "preco-asc" ? "preco-desc" : "preco-asc")}
                className="inline-flex items-center gap-1 hover:underline"
              >
                Preço unit. <IconePreco size={12} />
              </button>
            </th>
            <th className={`${th} text-left`}>Item</th>
            <th className={`${th} text-left`}>Órgão · fornecedor</th>
            <th className={`${th} text-left`} aria-sort={ordem === "data" ? "descending" : "none"}>
              <button onClick={() => onOrdem("data")} className="inline-flex items-center gap-1 hover:underline">
                Data {ordem === "data" && <ArrowDown size={12} />}
              </button>
            </th>
            <th className={th}><span className="sr-only">Fonte</span></th>
          </tr>
        </thead>
        <tbody>
          {precos.map((p) => {
            const incluso = !excluidos.has(p.id)
            const motivo  = motivos.get(p.id)
            return (
              <tr
                key={p.id}
                className="border-b last:border-b-0 align-top"
                style={{ borderColor: "var(--border)", background: incluso ? "white" : "var(--canvas)" }}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={incluso}
                    onChange={() => onToggle(p.id)}
                    aria-label={incluso ? `Excluir preço de ${p.fornecedor}` : `Incluir preço de ${p.fornecedor}`}
                    className="mt-0.5 h-4 w-4 accent-[#FF5A1F]"
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <span
                    className={`font-semibold tabular-nums ${incluso ? "" : "line-through"}`}
                    style={{ color: incluso ? "var(--navy)" : "var(--text-light)" }}
                  >
                    {formatarPrecoUnitario(p.valorUnitario)}
                  </span>
                  {motivo && (
                    <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px]" style={{ color: "var(--danger)" }} title={motivo}>
                      <AlertTriangle size={10} /> descarte sugerido
                    </span>
                  )}
                </td>
                <td className="px-3 py-3" style={{ opacity: incluso ? 1 : 0.55 }}>
                  <p className="line-clamp-2 text-[13px] leading-snug" style={{ color: "var(--navy)" }} title={p.descricao}>
                    {p.descricao}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {p.unidade || "Não informado"} · qtd. {p.quantidade.toLocaleString("pt-BR")}
                  </p>
                </td>
                <td className="px-3 py-3" style={{ opacity: incluso ? 1 : 0.55 }}>
                  <p className="truncate text-[13px]" style={{ color: "var(--navy)" }} title={p.orgaoNome}>
                    {p.orgaoNome}
                  </p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }} title={p.fornecedor}>
                    <strong className="font-semibold">{p.uf}</strong> · {p.fornecedor}
                  </p>
                </td>
                <td className="px-3 py-3 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {formatarData(p.dataResultado)}
                </td>
                <td className="px-3 py-3 text-center">
                  <a
                    href={p.linkPNCP}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${p.numeroControlePNCP} — fonte: PNCP, consultado em ${new Date(p.consultadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}
                    aria-label={`Abrir compra ${p.numeroControlePNCP} no PNCP`}
                    className="inline-flex"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Resumo estatístico (coluna do painel escuro) ────────────────────────── //

const CAIXA_ESCURA = { background: "rgb(255 255 255 / 0.04)", border: "1px solid #2B4469" }

function PainelResumo({ estatisticas: e, total }: { estatisticas: Estatisticas | null; total: number }) {
  if (!e) {
    return (
      <section className="rounded-xl px-4 py-4 text-center text-xs" style={{ ...CAIXA_ESCURA, color: "#94A3B8" }}>
        Inclua pelo menos um preço na tabela para ver o resumo.
      </section>
    )
  }

  const usarMediana = e.cvAlto

  return (
    <section className="rounded-xl px-4 py-3 flex flex-col gap-3" style={CAIXA_ESCURA}>
      <header className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold text-white">Resumo</h2>
        <span className="text-[11px] tabular-nums" style={{ color: "#94A3B8" }}>
          {e.n} de {total} preços
        </span>
      </header>

      <div className="rounded-lg px-3 py-2.5" style={{ background: "rgb(255 90 31 / 0.14)", border: "1px solid rgb(255 109 0 / 0.45)" }}>
        <p className="text-[11px]" style={{ color: "#FDBA74" }}>
          Sugestão de valor estimado · {usarMediana ? "mediana" : "média"}
        </p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
          {formatarPrecoResumido(usarMediana ? e.mediana : e.media)}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>
          {usarMediana
            ? "CV acima de 25%: a mediana é menos sensível a valores extremos."
            : "CV até 25%: preços homogêneos, a média é adequada."}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <Valor rotulo="Menor"   valor={e.menor} />
        <Valor rotulo="Maior"   valor={e.maior} />
        <Valor rotulo="Média"   valor={e.media}   destaque={!usarMediana} />
        <Valor rotulo="Mediana" valor={e.mediana} destaque={usarMediana} />
        <Valor rotulo="Desvio padrão" valor={e.desvio} />
        <div>
          <dt className="text-[11px]" style={{ color: "#94A3B8" }}>Coef. de variação</dt>
          <dd className="mt-0.5">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
              style={e.cvAlto
                ? { background: "rgb(247 144 9 / 0.18)", color: "#FDB022" }
                : { background: "rgb(34 197 94 / 0.16)", color: "#4ADE80" }}
            >
              {e.cv.toFixed(1).replace(".", ",")}%
            </span>
          </dd>
        </div>
      </dl>

      {(e.poucos || e.cvAlto) && (
        <ul className="flex flex-col gap-1.5 text-[11px]" style={{ color: "#FDB022" }}>
          {e.poucos && (
            <li className="flex gap-1.5"><AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Menos de 3 preços — exige justificativa (IN 65, art. 6º § 5º).
            </li>
          )}
          {e.cvAlto && (
            <li className="flex gap-1.5"><AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Alta dispersão — faça análise crítica e revise itens fora do padrão (art. 6º § 4º).
            </li>
          )}
        </ul>
      )}

      <p className="text-[10px] leading-relaxed" style={{ color: "#64748B" }}>
        Média, mediana ou menor preço são admitidos (IN SEGES/ME 65/2021, art. 6º; Lei 14.133/2021, art. 23).
        Valores das homologações do PNCP — não substituem o processo formal de pesquisa de preços.
      </p>
    </section>
  )
}

function Valor({ rotulo, valor, destaque }: { rotulo: string; valor: bigint; destaque?: boolean }) {
  return (
    <div>
      <dt className="text-[11px]" style={{ color: "#94A3B8" }}>{rotulo}</dt>
      <dd className="text-sm font-semibold tabular-nums" style={{ color: destaque ? "#FDBA74" : "#FFFFFF" }}>
        {formatarPrecoResumido(valor)}
      </dd>
    </div>
  )
}

// ─── Botões pequenos ─────────────────────────────────────────────────────── //

function Chip({
  ativo, onClick, disabled, children,
}: { ativo: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ativo}
      className="h-8 px-3 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50"
      style={{
        borderColor: ativo ? "var(--brand)" : "var(--border)",
        background:  ativo ? "rgb(255 90 31 / 0.10)" : "white",
        color:       ativo ? "var(--brand-ink)" : "var(--navy)",
      }}
    >
      {children}
    </button>
  )
}

function BotaoAcao({
  onClick, disabled, title, children,
}: { onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs border bg-white transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ borderColor: "var(--border)", color: "var(--navy)" }}
    >
      {children}
    </button>
  )
}
