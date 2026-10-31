"use client"

import { useRouter } from "next/navigation"
import { HelpCircle } from "lucide-react"

// Lê a URL no clique (e não via useSearchParams) para não exigir Suspense
// em toda seção que exibe o botão.
export function BotaoAjuda({ tourId, rotulo }: { tourId: string; rotulo: string }) {
  const router = useRouter()

  function iniciar() {
    const params = new URLSearchParams(window.location.search)
    params.set("tour", tourId)
    router.replace(`${window.location.pathname}?${params}`, { scroll: false })
  }

  return (
    <button
      type="button"
      onClick={iniciar}
      title={rotulo}
      aria-label={rotulo}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
      style={{ background: "rgb(255 90 31 / 0.12)", color: "var(--brand-ink)" }}
    >
      <HelpCircle size={14} />
    </button>
  )
}
