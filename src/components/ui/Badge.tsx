import { cn } from "@/lib/utils"

type Variante = "brand" | "navy" | "success" | "danger" | "warning" | "muted" | "info"

const estilos: Record<Variante, string> = {
  brand:   "bg-[#FF5A1F]/10 text-[#C2410C]",
  navy:    "bg-[#101828]/10 text-[#101828]",
  success: "bg-[#12B76A]/10 text-[#027A48]",
  danger:  "bg-[#F04438]/10 text-[#B42318]",
  warning: "bg-[#F79009]/10 text-[#B54708]",
  muted:   "bg-[#475467]/10 text-[#475467]",
  info:    "bg-[#2E90FA]/10 text-[#1849A9]",
}

interface BadgeProps {
  children: React.ReactNode
  variante?: Variante
  className?: string
}

export function Badge({ children, variante = "muted", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        estilos[variante],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Status derivado de uma contratação */
export function StatusBadge({ aberta, confirmado }: { aberta: boolean; confirmado: boolean }) {
  if (aberta && confirmado) {
    return (
      <Badge variante="success">
        <span className="h-1.5 w-1.5 rounded-full bg-[#12B76A]" aria-hidden="true" />
        Aberta
      </Badge>
    )
  }
  if (aberta && !confirmado) {
    return <Badge variante="warning">Situação a confirmar</Badge>
  }
  return <Badge variante="muted">Encerrada</Badge>
}
