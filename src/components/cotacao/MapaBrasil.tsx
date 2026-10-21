"use client"

import { useId, type ReactNode } from "react"
import brasil from "@svg-maps/brazil"

// Contornos: @svg-maps/brazil (Victor Cazanave, CC BY 4.0), viewBox 0 0 613 639.
// Posições de rótulo = centro da caixa delimitadora de cada path (calculado com svg-path-bbox).
// Estados pequenos recebem rótulo externo com linha-guia (ancora → rótulo).

interface RotuloInterno { tipo: "interno"; x: number; y: number }
interface RotuloExterno { tipo: "externo"; ax: number; ay: number; x: number; y: number }
type Rotulo = RotuloInterno | RotuloExterno

const ROTULOS: Record<string, Rotulo> = {
  AC: { tipo: "interno", x: 58,  y: 224 },
  AM: { tipo: "interno", x: 139, y: 141 },
  AP: { tipo: "interno", x: 339, y: 57 },
  BA: { tipo: "interno", x: 500, y: 293 },
  CE: { tipo: "interno", x: 541, y: 165 },
  GO: { tipo: "interno", x: 370, y: 345 },   // deslocado do centro para não cobrir o DF
  MA: { tipo: "interno", x: 448, y: 171 },
  MG: { tipo: "interno", x: 446, y: 376 },
  MS: { tipo: "interno", x: 304, y: 410 },
  MT: { tipo: "interno", x: 282, y: 281 },
  PA: { tipo: "interno", x: 335, y: 139 },
  PI: { tipo: "interno", x: 481, y: 189 },
  PR: { tipo: "interno", x: 354, y: 477 },
  RO: { tipo: "interno", x: 167, y: 251 },
  RR: { tipo: "interno", x: 190, y: 52 },
  RS: { tipo: "interno", x: 318, y: 579 },
  SC: { tipo: "interno", x: 358, y: 529 },
  SP: { tipo: "interno", x: 396, y: 442 },
  TO: { tipo: "interno", x: 402, y: 226 },
  RN: { tipo: "externo", ax: 581, ay: 174, x: 664, y: 160 },
  PB: { tipo: "externo", ax: 590, ay: 193, x: 664, y: 188 },
  PE: { tipo: "externo", ax: 575, ay: 213, x: 664, y: 216 },
  AL: { tipo: "externo", ax: 583, ay: 236, x: 664, y: 244 },
  SE: { tipo: "externo", ax: 572, ay: 250, x: 664, y: 272 },
  ES: { tipo: "externo", ax: 519, ay: 392, x: 560, y: 396 },
  RJ: { tipo: "externo", ax: 486, ay: 440, x: 540, y: 462 },
  DF: { tipo: "externo", ax: 409, ay: 330, x: 456, y: 324 },   // à direita da borda do GO (x=439 + afastamento)
}

// O index.d.ts do pacote depende de "svg-maps__common", que não é publicado — tipamos aqui
interface SvgMap { viewBox: string; locations: { id: string; name: string; path: string }[] }

export const ESTADOS = (brasil as unknown as SvgMap).locations.map((l) => ({
  uf: l.id.toUpperCase(), nome: l.name, path: l.path,
}))
export const NOME_UF = new Map(ESTADOS.map((e) => [e.uf, e.nome]))

// Mapa "explodido": cada estado se afasta do centro do país proporcionalmente à distância
const CENTRO_X = 306
const CENTRO_Y = 320
const AFASTAMENTO = 0.075
const ESPESSURA = 9  // deslocamento da sombra que dá volume às placas

function deslocamento(uf: string): [number, number] {
  const r = ROTULOS[uf]
  if (!r) return [0, 0]
  const x = r.tipo === "externo" ? r.ax : r.x
  const y = r.tipo === "externo" ? r.ay : r.y
  return [(x - CENTRO_X) * AFASTAMENTO, (y - CENTRO_Y) * AFASTAMENTO]
}

const LARANJA = "#FF5A1F"
const DESTAQUE = "#FDBA74"

// ─── Mapa ────────────────────────────────────────────────────────────────── //

interface MapaProps {
  contadores:    Map<string, number>
  buscando:      boolean
  ufSelecionada: string | null
  onClickUf:     (uf: string | null) => void
}

export function MapaBrasil({ contadores, buscando, ufSelecionada, onClickUf }: MapaProps) {
  const id  = useId().replace(/:/g, "")
  const max = Math.max(1, ...contadores.values())
  const clicavel = (n: number) => n > 0 && !buscando

  return (
    <svg
      viewBox="-40 -40 760 740"
      width="100%"
      role="group"
      aria-label="Mapa do Brasil com a quantidade de preços por estado"
      className={`mapa-br block ${buscando ? "buscando" : ""}`}
    >
      <style>{`
        .mapa-br .uf-ativo { cursor: pointer; }
        .mapa-br .uf-ativo:hover .contorno { stroke: #fff; }
        .mapa-br .uf-ativo:focus { outline: none; }
        .mapa-br .uf-ativo:focus-visible .contorno { stroke: #fff; stroke-width: 3; }
        @media (prefers-reduced-motion: no-preference) {
          .mapa-br .varredura { animation: br-varre 2.6s linear infinite; }
          .mapa-br.buscando .uf-vazio .contorno { animation: br-onda 2.6s ease-in-out infinite; }
          .mapa-br .pop { animation: br-pop 1s ease-out forwards; }
        }
        @keyframes br-varre { from { transform: translateY(-120px); } to { transform: translateY(720px); } }
        @keyframes br-onda  { 0%, 100% { stroke: #2B4469; } 50% { stroke: #4F7FB8; } }
        @keyframes br-pop   { 0% { stroke-width: 10; opacity: .9; } 100% { stroke-width: 1; opacity: 0; } }
      `}</style>

      <defs>
        <filter id={`${id}-brilho`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={`${id}-brasil`}>
          {ESTADOS.map((e) => {
            const [dx, dy] = deslocamento(e.uf)
            return <path key={e.uf} d={e.path} transform={`translate(${dx} ${dy})`} />
          })}
        </clipPath>
        <linearGradient id={`${id}-varre`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={LARANJA} stopOpacity="0" />
          <stop offset="90%"  stopColor={LARANJA} stopOpacity="0.28" />
          <stop offset="100%" stopColor={DESTAQUE} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Espessura: sombra de cada placa, deslocada para baixo */}
      <g pointerEvents="none">
        {ESTADOS.map(({ uf, path }) => {
          const [dx, dy] = deslocamento(uf)
          const ativo = (contadores.get(uf) ?? 0) > 0
          return (
            <path
              key={uf}
              d={path}
              transform={`translate(${dx} ${dy + ESPESSURA})`}
              fill={ativo ? "#7C2D12" : "#050A14"}
              stroke={ativo ? "#9A3412" : "#0B1526"}
              strokeWidth={1}
              strokeLinejoin="round"
              style={{ transition: "fill .3s" }}
            />
          )
        })}
      </g>

      {/* Estados */}
      {ESTADOS.map(({ uf, nome, path }) => {
        const [dx, dy] = deslocamento(uf)
        const n = contadores.get(uf) ?? 0
        const ativo = n > 0
        const sel = ufSelecionada === uf
        const alfa = ativo ? 0.16 + 0.5 * Math.sqrt(n / max) : 1
        const r = ROTULOS[uf]
        // Onda de varredura de cima para baixo: atraso proporcional à altura do estado
        const atraso = r ? (((r.tipo === "externo" ? r.ay : r.y) / 639) * 2.6).toFixed(2) : "0"
        const rotulo = `${nome}: ${n} ${n === 1 ? "preço" : "preços"}`

        return (
          <g
            key={uf}
            transform={`translate(${dx} ${dy})`}
            className={clicavel(n) ? "uf-ativo" : "uf-vazio"}
            onClick={clicavel(n) ? () => onClickUf(sel ? null : uf) : undefined}
            onKeyDown={clicavel(n) ? (e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClickUf(sel ? null : uf) }
            } : undefined}
            tabIndex={clicavel(n) ? 0 : undefined}
            role={clicavel(n) ? "button" : undefined}
            aria-pressed={clicavel(n) ? sel : undefined}
            aria-label={clicavel(n) ? `${rotulo}. ${sel ? "Remover filtro" : "Filtrar"}` : undefined}
          >
            <title>{ativo ? rotulo : `${nome}: sem preços`}</title>
            <path
              d={path}
              fill={ativo ? LARANJA : "#13213A"}
              fillOpacity={sel ? 0.9 : ativo ? alfa : 1}
              style={{ transition: "fill .3s, fill-opacity .3s" }}
            />
            <path
              className="contorno"
              d={path}
              fill="none"
              stroke={sel ? "#FFFFFF" : ativo ? "#FF6D00" : "#2B4469"}
              strokeWidth={sel ? 2.5 : ativo ? 1.6 : 1}
              strokeLinejoin="round"
              filter={ativo || sel ? `url(#${id}-brilho)` : undefined}
              style={{ transition: "stroke .3s", animationDelay: `${atraso}s` }}
            />
            {ativo && buscando && (
              <path key={n} className="pop" d={path} fill="none" stroke={DESTAQUE} opacity={0} pointerEvents="none" />
            )}
          </g>
        )
      })}

      {/* Varredura do "robô", recortada no contorno do país */}
      {buscando && (
        <g clipPath={`url(#${id}-brasil)`} pointerEvents="none">
          <rect className="varredura" x={-40} y={0} width={760} height={80} fill={`url(#${id}-varre)`} />
        </g>
      )}

      {/* Rótulos */}
      {ESTADOS.map(({ uf }) => {
        const r = ROTULOS[uf]
        if (!r) return null
        const n = contadores.get(uf) ?? 0
        const ativo = n > 0
        const sel = ufSelecionada === uf
        const corUf  = sel ? "#101828" : ativo ? DESTAQUE : "#5D7BA3"
        const corNum = sel ? "#101828" : "#FFFFFF"
        const [dx, dy] = deslocamento(uf)

        if (r.tipo === "externo") {
          return (
            <g
              key={uf}
              pointerEvents={clicavel(n) ? undefined : "none"}
              onClick={clicavel(n) ? () => onClickUf(sel ? null : uf) : undefined}
              style={{ cursor: clicavel(n) ? "pointer" : undefined }}
            >
              <line x1={r.ax + dx} y1={r.ay + dy} x2={r.x - 4} y2={r.y - 4} stroke={ativo ? "#FF6D00" : "#2B4469"} strokeWidth={1} />
              <circle cx={r.ax + dx} cy={r.ay + dy} r={2} fill={ativo ? DESTAQUE : "#2B4469"} />
              <text x={r.x} y={r.y} fontSize={13} fontWeight={700} fill={sel ? "#FFFFFF" : corUf}>
                {uf}
                {ativo && <tspan dx={5} fill={sel ? DESTAQUE : "#FFFFFF"} style={{ fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("pt-BR")}</tspan>}
              </text>
            </g>
          )
        }

        return (
          <g key={uf} pointerEvents="none" textAnchor="middle" transform={`translate(${dx} ${dy})`}>
            <text x={r.x} y={ativo ? r.y - 7 : r.y + 4} fontSize={13} fontWeight={700} fill={corUf}>
              {uf}
            </text>
            {ativo && (
              <text x={r.x} y={r.y + 12} fontSize={17} fontWeight={700} fill={corNum} style={{ fontVariantNumeric: "tabular-nums" }}>
                {n.toLocaleString("pt-BR")}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Painel escuro (mapa + coluna lateral) ───────────────────────────────── //

interface PainelProps extends MapaProps {
  titulo:    string
  subtitulo: string
  lateral:   ReactNode
}

export function PainelMapa({ titulo, subtitulo, lateral, ...mapa }: PainelProps) {
  const total = [...mapa.contadores.values()].reduce((a, b) => a + b, 0)

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{
        background: "radial-gradient(120% 90% at 30% 20%, #16274A 0%, #101828 55%, #0A1120 100%)",
        border: "1px solid #22385C",
        boxShadow: "0 20px 50px -20px rgb(16 24 40 / 0.6)",
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: DESTAQUE }}>Cotação</p>
          <h2 className="text-xl font-semibold tracking-tight text-white">{titulo}</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>{subtitulo}</p>
          <div className="mx-auto -mt-4 -mb-10 w-full max-w-170" style={{ perspective: "1600px" }}>
            <div style={{ transform: "rotateX(34deg) rotateZ(-3deg)", transformOrigin: "50% 60%" }}>
              <MapaBrasil {...mapa} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="rounded-xl px-4 py-3" style={{ background: "rgb(255 255 255 / 0.04)", border: "1px solid #2B4469" }}>
            <p className="text-xs" style={{ color: "#94A3B8" }}>Total de preços</p>
            <p className="text-3xl font-semibold tabular-nums text-white">{total.toLocaleString("pt-BR")}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: "#94A3B8" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: mapa.buscando ? LARANJA : "#22C55E" }} />
              {mapa.contadores.size} {mapa.contadores.size === 1 ? "estado" : "estados"} · consulta ao vivo no PNCP
            </p>
          </div>
          {lateral}
        </div>
      </div>

      <p className="mt-3 text-[10px]" style={{ color: "#5D7BA3" }}>
        Contornos: svg-maps/brazil (Victor Cazanave), CC BY 4.0
      </p>
    </section>
  )
}

// ─── Ranking lateral (clicável) ──────────────────────────────────────────── //

export function RankingUf({
  contadores, ufSelecionada, onClickUf,
}: Pick<MapaProps, "contadores" | "ufSelecionada" | "onClickUf">) {
  const linhas = [...contadores].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const max = linhas[0]?.[1] ?? 1

  return (
    <div className="flex min-h-0 flex-col rounded-xl" style={{ background: "rgb(255 255 255 / 0.04)", border: "1px solid #2B4469" }}>
      <p className="px-4 pt-3 pb-2 text-xs font-semibold text-white">Preços por estado</p>
      <ul className="max-h-56 overflow-y-auto px-2 pb-2">
        {linhas.map(([uf, n]) => {
          const sel = uf === ufSelecionada
          return (
            <li key={uf}>
              <button
                onClick={() => onClickUf(sel ? null : uf)}
                aria-pressed={sel}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                style={{ background: sel ? "rgb(253 186 116 / 0.14)" : undefined }}
                title={`${NOME_UF.get(uf) ?? uf}: ${n} ${n === 1 ? "preço" : "preços"}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: sel ? DESTAQUE : LARANJA, opacity: 0.35 + 0.65 * Math.sqrt(n / max) }} />
                <span className="w-6 font-bold" style={{ color: sel ? "#fff" : DESTAQUE }}>{uf}</span>
                <span className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "#1E3150" }}>
                  <span className="block h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: sel ? DESTAQUE : LARANJA }} />
                </span>
                <span className="w-8 text-right font-semibold tabular-nums text-white">{n.toLocaleString("pt-BR")}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
