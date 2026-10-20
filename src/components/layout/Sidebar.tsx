"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { LayoutDashboard, Search, BookmarkCheck, Settings } from "lucide-react"

const ITEMS = [
  { href: "/painel",         icon: LayoutDashboard, label: "Painel" },
  { href: "/licitacoes",     icon: Search,          label: "Buscar" },
  { href: "/acompanhamento", icon: BookmarkCheck,   label: "Acompanhamento" },
  { href: "/admin",          icon: Settings,        label: "Admin" },
]

function SidebarLinks() {
  const pathname = usePathname()
  return (
    <>
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const ativo = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={ativo ? "page" : undefined}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
            style={{
              background: ativo ? "rgb(255 90 31 / 0.12)" : "transparent",
              color:      ativo ? "var(--brand)" : "var(--text-muted)",
            }}
          >
            <Icon size={20} strokeWidth={1.75} />
          </Link>
        )
      })}
    </>
  )
}

function SidebarLinksFallback() {
  return (
    <>
      {ITEMS.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          title={label}
          aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "transparent", color: "var(--text-muted)" }}
        >
          <Icon size={20} strokeWidth={1.75} />
        </Link>
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
