import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { TopNav } from "@/components/layout/TopNav"
import { Sidebar } from "@/components/layout/Sidebar"
import { UserMenuServer } from "@/components/layout/UserMenuServer"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title:       { default: "LicitaRadar", template: "%s — LicitaRadar" },
  description: "Pesquise e monitore licitações públicas brasileiras em uma só plataforma.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body
        className="flex flex-col h-full"
        style={{ background: "var(--canvas)" }}
      >
        <TopNav userMenu={<Suspense><UserMenuServer /></Suspense>} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main
            id="conteudo-principal"
            className="flex-1 overflow-y-auto"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
