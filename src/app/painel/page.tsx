import type { Metadata } from "next"
import { BarChart3, Clock } from "lucide-react"

export const metadata: Metadata = { title: "Painel" }

export default function PainelPage() {
  return <EmConstrucao titulo="Painel" icon={<BarChart3 size={40} />} fase={6} />
}

export function EmConstrucao({ titulo, icon, fase }: { titulo: string; icon: React.ReactNode; fase: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgb(255 90 31 / 0.10)", color: "var(--brand)" }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--navy)" }}>{titulo}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Será implementado na Etapa {fase}.
        </p>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <Clock size={14} />
        <span>Esta funcionalidade ainda não está disponível</span>
      </div>
    </div>
  )
}
