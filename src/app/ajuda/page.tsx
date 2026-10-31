import type { Metadata } from "next"
import Link from "next/link"
import { TOURS } from "@/lib/tours"
import { HelpCircle, Play } from "lucide-react"

export const metadata: Metadata = { title: "Tire suas dúvidas" }

export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "rgb(255 90 31 / 0.10)", color: "var(--brand)" }}
        >
          <HelpCircle size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>
            Tire suas dúvidas
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tutoriais passo a passo das funcionalidades do LicitaRadar
          </p>
        </div>
      </div>

      {/* Grid de tours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOURS.map((tour) => (
          <article
            key={tour.id}
            className="rounded-2xl border bg-white p-5 flex flex-col gap-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5" aria-hidden>
                {tour.icone}
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                  {tour.titulo}
                </h2>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {tour.descricao}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {tour.steps.length} passos
              </span>
              <div className="flex gap-1.5 ml-auto">
                {/* Navega para a página do tour e inicia */}
                <Link
                  href={`${tour.paginaInicio}?tour=${tour.id}`}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: "var(--brand)", color: "var(--navy)" }}
                >
                  <Play size={11} />
                  Iniciar tutorial
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Dica */}
      <div
        className="mt-8 rounded-2xl border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--navy)" }}>Como funciona:</strong>{" "}
          ao clicar em &quot;Iniciar tutorial&quot;, você será levado à página correta e um guia passo a passo
          irá destacar cada elemento explicando o que ele faz. Pressione{" "}
          <kbd
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ background: "var(--border)", color: "var(--navy)" }}
          >
            Esc
          </kbd>{" "}
          ou clique em <strong>Concluir</strong> para encerrar a qualquer momento.
        </p>
      </div>
    </div>
  )
}
