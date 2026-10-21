"use client"

import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Search, SlidersHorizontal, X, AlertTriangle, RotateCw } from "lucide-react"
import { UFS } from "@/lib/constants"
import { formatarDataHora, formatarNumero } from "@/lib/format"
import {
  buscarEditais, filtrosDaUrl, montarUrlBusca, TAM_PAGINA, ESFERAS, ORDENACOES,
  type ResultadoBusca,
} from "@/lib/pncp-search"
import type { PncpModalidade } from "@/lib/types"
import { CardEdital } from "./CardEdital"
import { PaginacaoClient } from "./PaginacaoClient"
import { Spinner } from "@/components/ui/Spinner"

interface Estado {
  chave: string
  dados?: ResultadoBusca
  erro?: string
  consultadoEm?: string
}

export function BuscaPncpClient({ modalidades }: { modalidades: PncpModalidade[] }) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const [, startTransition] = useTransition()
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [estado, setEstado] = useState<Estado>({ chave: "" })

  const paramsStr  = params.toString()
  const filtros    = filtrosDaUrl(new URLSearchParams(paramsStr))
  const carregando = estado.chave !== `${montarUrlBusca(filtros)}#${tentativa}`

  useEffect(() => {
    const f     = filtrosDaUrl(new URLSearchParams(paramsStr))
    const chave = `${montarUrlBusca(f)}#${tentativa}`
    const ctrl  = new AbortController()
    buscarEditais(f, ctrl.signal)
      .then((dados) => setEstado({ chave, dados, consultadoEm: formatarDataHora(new Date().toISOString()) }))
      .catch((err) => {
        if (!ctrl.signal.aborted) setEstado({ chave, erro: err instanceof Error ? err.message : String(err) })
      })
    return () => ctrl.abort()
  }, [paramsStr, tentativa])

  const navegar = (mudar: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString())
    mudar(next)
    next.delete("pagina")
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  const definir = (chaveUrl: string, valores: string[]) =>
    navegar((p) => (valores.length ? p.set(chaveUrl, valores.join(",")) : p.delete(chaveUrl)))

  const alternar = (chaveUrl: string, atuais: string[], valor: string) =>
    definir(chaveUrl, atuais.includes(valor) ? atuais.filter((v) => v !== valor) : [...atuais, valor])

  const nomeModalidade = (id: string) => modalidades.find((m) => String(m.id) === id)?.nome ?? `Modalidade ${id}`
  const nomeEsfera     = (id: string) => ESFERAS.find((e) => e.id === id)?.nome ?? id

  const chips = [
    ...(filtros.q ? [{ rotulo: `"${filtros.q}"`, remover: () => navegar((p) => p.delete("q")) }] : []),
    ...filtros.ufs.map((uf) => ({ rotulo: uf, remover: () => alternar("uf", filtros.ufs, uf) })),
    ...filtros.esferas.map((e) => ({ rotulo: nomeEsfera(e), remover: () => alternar("esfera", filtros.esferas, e) })),
    ...filtros.modalidades.map((m) => ({ rotulo: nomeModalidade(m), remover: () => alternar("modalidade", filtros.modalidades, m) })),
  ]
  const totalFiltros = chips.length - (filtros.q ? 1 : 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Busca por palavra */}
      <form
        key={filtros.q}
        onSubmit={(ev) => {
          ev.preventDefault()
          const q = (ev.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim()
          navegar((p) => (q ? p.set("q", q) : p.delete("q")))
        }}
        className="flex gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-light)" }} aria-hidden="true" />
          <input
            name="q"
            type="search"
            defaultValue={filtros.q}
            placeholder="O que você vende? Ex.: seringa, notebook, merenda escolar…"
            aria-label="Buscar por palavra no objeto e nos itens"
            className="h-11 w-full rounded-xl border pl-10 pr-3 text-[15px] bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}
          />
        </div>
        <button type="submit" className="h-11 px-5 rounded-xl text-sm font-semibold transition-colors" style={{ background: "var(--brand)", color: "var(--navy)" }}>
          Buscar
        </button>
      </form>
      <p className="text-xs -mt-2" style={{ color: "var(--text-muted)" }}>
        A busca procura no objeto e também na descrição de cada item do edital.
      </p>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Filtros */}
        <aside className="w-full lg:w-60 shrink-0">
          <button
            onClick={() => setFiltrosAbertos((v) => !v)}
            className="lg:hidden flex w-full items-center justify-between h-10 px-4 rounded-xl border bg-white text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}
            aria-expanded={filtrosAbertos}
            aria-controls="painel-filtros"
          >
            <span className="flex items-center gap-2"><SlidersHorizontal size={15} /> Filtros{totalFiltros > 0 && ` (${totalFiltros})`}</span>
            <span aria-hidden="true">{filtrosAbertos ? "−" : "+"}</span>
          </button>

          <div
            id="painel-filtros"
            className={`${filtrosAbertos ? "flex" : "hidden"} lg:flex glass flex-col gap-5 rounded-2xl p-4 mt-2 lg:mt-0`}
            style={{ border: "1px solid var(--border-glass)" }}
          >
            <GrupoFiltro titulo="Esfera">
              {ESFERAS.map((e) => (
                <Opcao key={e.id} rotulo={e.nome} marcado={filtros.esferas.includes(e.id)} onChange={() => alternar("esfera", filtros.esferas, e.id)} />
              ))}
            </GrupoFiltro>

            <GrupoFiltro titulo="Modalidade">
              {modalidades.filter((m) => m.statusAtivo).map((m) => (
                <Opcao key={m.id} rotulo={m.nome} marcado={filtros.modalidades.includes(String(m.id))} onChange={() => alternar("modalidade", filtros.modalidades, String(m.id))} />
              ))}
            </GrupoFiltro>

            <GrupoFiltro titulo="Estado (UF do órgão)">
              <div className="grid grid-cols-4 gap-1">
                {UFS.map((uf) => {
                  const ativo = filtros.ufs.includes(uf)
                  return (
                    <button
                      key={uf}
                      onClick={() => alternar("uf", filtros.ufs, uf)}
                      aria-pressed={ativo}
                      className="h-7 rounded-md text-xs font-medium border transition-colors"
                      style={{
                        borderColor: ativo ? "var(--brand)" : "var(--border)",
                        background:  ativo ? "rgb(255 90 31 / 0.10)" : "white",
                        color:       ativo ? "var(--brand-ink)" : "var(--navy)",
                      }}
                    >
                      {uf}
                    </button>
                  )
                })}
              </div>
            </GrupoFiltro>
          </div>
        </aside>

        {/* Resultados */}
        <section className="flex-1 min-w-0 w-full" aria-live="polite" aria-busy={carregando}>
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {chips.map((c) => (
                <button
                  key={c.rotulo}
                  onClick={c.remover}
                  className="flex items-center gap-1 h-7 pl-3 pr-2 rounded-full text-xs font-medium border bg-white hover:bg-gray-50"
                  style={{ borderColor: "var(--border)", color: "var(--navy)" }}
                  aria-label={`Remover filtro ${c.rotulo}`}
                >
                  {c.rotulo} <X size={12} />
                </button>
              ))}
              <button onClick={() => startTransition(() => router.push(pathname))} className="text-xs font-medium hover:underline ml-1" style={{ color: "var(--danger)" }}>
                Limpar tudo
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {carregando ? "Consultando o PNCP…" : estado.dados ? resumo(estado.dados.total, filtros.q) : ""}
            </p>
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Ordenar
              <select
                value={filtros.ordenacao}
                onChange={(ev) => navegar((p) => (ev.target.value === "relevancia" ? p.delete("ordem") : p.set("ordem", ev.target.value)))}
                className="h-8 rounded-lg border px-2 text-sm bg-white"
                style={{ borderColor: "var(--border)", color: "var(--navy)" }}
              >
                {ORDENACOES.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </label>
          </div>

          {carregando ? (
            <div className="flex justify-center py-16"><Spinner tamanho={28} /></div>
          ) : estado.erro ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border p-8 text-center" style={{ borderColor: "var(--danger)", background: "rgb(240 68 56 / 0.04)" }} role="alert">
              <AlertTriangle size={28} style={{ color: "var(--danger)" }} />
              <p className="font-medium" style={{ color: "var(--danger)" }}>A busca do PNCP não respondeu</p>
              <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
                Tentamos 3 vezes. A busca por palavra do PNCP não é oficial e às vezes fica indisponível.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                <button onClick={() => setTentativa((t) => t + 1)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold" style={{ background: "var(--brand)", color: "var(--navy)" }}>
                  <RotateCw size={14} /> Tentar de novo
                </button>
                <Link href="/licitacoes?modo=lista" className="flex items-center h-9 px-4 rounded-xl text-sm font-medium border bg-white" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
                  Ver lista sem busca por palavra
                </Link>
              </div>
            </div>
          ) : estado.dados && estado.dados.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="font-medium" style={{ color: "var(--navy)" }}>Nenhum edital recebendo proposta com esses critérios</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tente outra palavra ou remova algum filtro.</p>
            </div>
          ) : estado.dados ? (
            <>
              <div className="flex flex-col gap-3">
                {estado.dados.items.map((e) => (
                  <CardEdital key={e.numero_controle_pncp} edital={e} consultadoEm={estado.consultadoEm ?? ""} />
                ))}
              </div>
              <PaginacaoClient paginaAtual={filtros.pagina} totalPaginas={Math.ceil(estado.dados.total / TAM_PAGINA)} />
              <p className="text-center text-[11px] pb-4" style={{ color: "var(--text-light)" }}>
                Busca do portal PNCP (não oficial), consultada do seu navegador em {estado.consultadoEm} · nada é armazenado ·{" "}
                <a href="https://pncp.gov.br/app/editais" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--brand-ink)" }}>
                  Portal original ↗
                </a>
              </p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  )
}

function resumo(total: number, q: string): string {
  const n = formatarNumero(total)
  const editais = total === 1 ? "edital recebendo proposta" : "editais recebendo proposta"
  return q ? `${n} ${editais} com "${q}"` : `${n} ${editais}`
}

function GrupoFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>{titulo}</legend>
      {children}
    </fieldset>
  )
}

function Opcao({ rotulo, marcado, onChange }: { rotulo: string; marcado: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--navy)" }}>
      <input type="checkbox" checked={marcado} onChange={onChange} className="h-4 w-4 accent-[#FF5A1F]" />
      {rotulo}
    </label>
  )
}
