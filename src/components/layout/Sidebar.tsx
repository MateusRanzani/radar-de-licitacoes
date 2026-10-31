"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { LayoutDashboard, Search, BookmarkCheck, Settings, Calculator, HelpCircle } from "lucide-react"

const ITEMS = [
  { href: "/painel",         icon: LayoutDashboard, label: "Painel" },
  { href: "/licitacoes",     icon: Search,          label: "Buscar" },
  { href: "/cotacao",        icon: Calculator,      label: "Cotação" },
  { href: "/acompanhamento", icon: BookmarkCheck,   label: "Acompanhamento" },
  { href: "/admin",          icon: Settings,        label: "Admin" },
]

const ITEMS_BOTTOM = [
  { href: "/ajuda", icon: HelpCircle, label: "Tire suas dúvidas" },
]

function NavLink({ href, icon: Icon, label, ativo, destaque }: {
  href: string
  icon: React.ComponentType<{ size: number; strokeWidth: number }>
  label: string
  ativo: boolean
  destaque?: boolean
}) {
  const cor = ativo ? "var(--brand)" : destaque ? "var(--brand-ink)" : "var(--text-muted)"
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={ativo ? "page" : undefined}
      className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
      style={{
        background: ativo || destaque ? "rgb(255 90 31 / 0.12)" : "transparent",
        color:      cor,
      }}
    >
      <Icon size={20} strokeWidth={1.75} />
    </Link>
  )
}

// Separador fica logo abaixo do último item: manter a ajuda colada ao menu
// evita que o badge de dev do Next.js (canto inferior esquerdo) a esconda.
function Separador() {
  return <div className="h-px w-7 my-1.5" style={{ background: "var(--border)" }} aria-hidden />
}

function SidebarLinks() {
  const pathname = usePathname()
  const estaAtivo = (href: string) => pathname === href || pathname.startsWith(href + "/")
  return (
    <>
      {ITEMS.map((item) => (
        <NavLink key={item.href} {...item} ativo={estaAtivo(item.href)} />
      ))}

      <Separador />

      {ITEMS_BOTTOM.map((item) => (
        <NavLink key={item.href} {...item} ativo={estaAtivo(item.href)} destaque />
      ))}
    </>
  )
}

function SidebarLinksFallback() {
  return (
    <>
      {ITEMS.map((item) => (
        <NavLink key={item.href} {...item} ativo={false} />
      ))}
      <Separador />
      {ITEMS_BOTTOM.map((item) => (
        <NavLink key={item.href} {...item} ativo={false} destaque />
      ))}
    </>
  )
}

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex w-16 flex-col items-center py-4 gap-2 shrink-0"
      style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}
      aria-label="Ações rápidas"
    >
      <Suspense fallback={<SidebarLinksFallback />}>
        <SidebarLinks />
      </Suspense>
    </aside>
  )
}
