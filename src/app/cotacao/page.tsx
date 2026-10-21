import type { Metadata } from "next"
import { CotacaoClient } from "@/components/cotacao/CotacaoClient"

export const metadata: Metadata = {
  title: "Cotação de preços",
  description: "Pesquise preços homologados em compras públicas e calcule o valor estimado conforme a IN SEGES/ME 65/2021.",
}

export default function CotacaoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>
          Cotação de preços
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Pesquise preços homologados em compras públicas · calcula média, mediana e menor conforme a IN SEGES 65/2021
        </p>
      </div>
      <CotacaoClient />
    </div>
  )
}
