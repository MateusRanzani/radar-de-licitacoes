"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, Suspense, type ReactNode } from "react"
import { Menu, X } from "lucide-react"

const NAVLINKS = [
  { href: "/painel",          label: "Painel" },
  { href: "/licitacoes",      label: "Buscar" },
  { href: "/acompanhamento",  label: "Acompanhamento" },
  { href: "/admin",           label: "Admin" },
]

// ─── Parte que lê o pathname (dentro de Suspense) ────────────────────────── //
function NavLinks({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {NAVLINKS.map((link) => {
        const ativo = pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            className={mobile
              ? "px-4 py-2.5 rounded-xl text-sm font-medium"
              : "px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            }
            style={{
              background: ativo ? "var(--brand)" : "transparent",
              color:      ativo ? "var(--navy)" : "var(--text-muted)",
            }}
            onClick={onClose}
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}

// Fallback estático sem active state (usado durante prerender)
function NavLinksFallback({ mobile }: { mobile?: boolean }) {
  return (
    <>
      {NAVLINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={mobile
            ? "px-4 py-2.5 rounded-xl text-sm font-medium"
            : "px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          }
          style={{ background: "transparent", color: "var(--text-muted)" }}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}

// ─── Shell do TopNav (não precisa de pathname) ────────────────────────────── //
export function TopNav({ userMenu }: { userMenu?: ReactNode }) {
  const [aberto, setAberto] = useState(false)

  return (
    <header
      className="glass sticky top-0 z-40 flex h-16 items-center gap-4 px-4 sm:px-6"
      style={{ borderBottom: "1px solid var(--border)", borderRadius: 0 }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold tracking-tight mr-4 shrink-0"
        style={{ color: "var(--navy)" }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--brand)" }}
          aria-hidden="true"
        >
          LR
        </span>
        <span className="hidden sm:block text-[15px]">LicitaRadar</span>
      </Link>

      {/* Nav desktop */}
      <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </nav>

      {/* User menu (server-rendered slot) */}
      <div className="hidden md:flex ml-auto items-center">
        {userMenu}
      </div>

      {/* Botão mobile */}
      <button
        className="flex md:hidden ml-auto h-9 w-9 items-center justify-center rounded-full"
        style={{ background: "rgb(16 24 40 / 0.06)", color: "var(--navy)" }}
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        aria-controls="mobile-menu"
      >
        {aberto ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Menu mobile */}
      {aberto && (
        <div
          id="mobile-menu"
          className="glass absolute top-16 left-0 right-0 flex flex-col p-4 gap-1 shadow-lg"
          style={{ borderTop: "1px solid var(--border)", borderRadius: 0 }}
        >
          <Suspense fallback={<NavLinksFallback mobile />}>
            <NavLinks mobile onClose={() => setAberto(false)} />
          </Suspense>
        </div>
      )}
    </header>
  )
}
