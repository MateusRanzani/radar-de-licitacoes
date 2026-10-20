"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[licitacoes] erro:", error)
  }, [error])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 w-full flex flex-col items-center gap-4 text-center">
      <AlertTriangle size={36} style={{ color: "var(--danger)" }} />
      <p className="font-semibold text-lg" style={{ color: "var(--navy)" }}>Algo deu errado</p>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error.message}</p>
      <button
        onClick={reset}
        className="mt-2 rounded-xl px-5 py-2 text-sm font-medium text-white"
        style={{ background: "var(--brand)" }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
