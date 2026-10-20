import Link from "next/link"
import { Search, TrendingUp, BarChart3 } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Início — LicitaRadar",
  description: "Pesquise e monitore licitações públicas brasileiras em um só lugar.",
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        {/* Manchas de fundo (estáticas, sem animação) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -top-32 -right-32 h-125 w-125 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-32 -left-32 h-100 w-100 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, var(--navy) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4"
            style={{ color: "var(--navy)" }}
          >
            Licitações públicas,<br />
            <span style={{ color: "var(--brand)" }}>em um só lugar</span>
          </h1>
          <p className="text-lg mb-10" style={{ color: "var(--text-muted)" }}>
            Pesquise editais, pregões e dispensas de todos os portais brasileiros.
            Filtre, acompanhe e não perca nenhum prazo.
          </p>

          {/* Barra de busca principal */}
          <form action="/licitacoes" method="get" role="search">
            <div
              className="glass flex items-center gap-2 rounded-2xl p-2 shadow-lg"
              style={{ maxWidth: 560, margin: "0 auto" }}
            >
              <input
                type="search"
                name="q"
                placeholder="Buscar licitações — ex: software, medicamentos, construção…"
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                style={{ color: "var(--navy)" }}
                aria-label="Buscar licitações"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                style={{ background: "var(--navy)", color: "white" }}
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Links rápidos */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {["Pregão Eletrônico", "Dispensa", "Concorrência", "TI e Software", "Saúde"].map((t) => (
              <Link
                key={t}
                href={`/licitacoes?q=${encodeURIComponent(t)}`}
                className="rounded-full border px-3 py-1 text-[13px] transition-colors hover:bg-white"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cards de acesso rápido ───────────────────────────────────────── */}
      <section className="px-4 pb-16 mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickCard
            href="/licitacoes"
            icon={<Search size={22} />}
            title="Buscar"
            desc="Pesquise por palavras-chave, UF, modalidade e mais."
          />
          <QuickCard
            href="/painel"
            icon={<BarChart3 size={22} />}
            title="Painel"
            desc="Indicadores, mapa e evolução das contratações."
            emConstrucao
          />
          <QuickCard
            href="/acompanhamento"
            icon={<TrendingUp size={22} />}
            title="Acompanhamento"
            desc="Favoritos, alertas e pesquisas salvas."
            emConstrucao
          />
        </div>

        {/* Aviso de cobertura */}
        <p className="mt-8 text-center text-[13px]" style={{ color: "var(--text-light)" }}>
          Dados ao vivo do PNCP (Portal Nacional de Contratações Públicas) · sem banco de dados ainda (Etapa 0)
        </p>
      </section>
    </div>
  )
}

function QuickCard({
  href, icon, title, desc, emConstrucao,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  emConstrucao?: boolean
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "rgb(255 90 31 / 0.10)", color: "var(--brand)" }}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-[15px]" style={{ color: "var(--navy)" }}>{title}</h2>
          {emConstrucao && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "rgb(247 144 9 / 0.12)", color: "var(--warning)" }}
            >
              Em breve
            </span>
          )}
        </div>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
    </Link>
  )
}
