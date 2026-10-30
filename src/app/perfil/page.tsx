import { connection } from "next/server"
import { Suspense } from "react"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { db } from "@/db"
import { usuarios } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"
import { PerfilForm } from "./PerfilForm"

export const metadata: Metadata = { title: "Perfil" }

export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 w-full space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgb(255 90 31 / 0.10)", color: "var(--brand)" }}
        >
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>Perfil</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Configurações da sua conta</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />}>
        <PerfilDados />
      </Suspense>
    </div>
  )
}

async function PerfilDados() {
  await connection()
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [user] = await db
    .select({
      cnpjOrgao:           usuarios.cnpjOrgao,
      nomeOrgao:           usuarios.nomeOrgao,
      codigoIbgeMunicipio: usuarios.codigoIbgeMunicipio,
    })
    .from(usuarios)
    .where(eq(usuarios.id, session.user.id))
    .limit(1)

  return (
    <PerfilForm
      nome={session.user.name ?? ""}
      email={session.user.email ?? ""}
      cnpjOrgao={user?.cnpjOrgao ?? ""}
      nomeOrgao={user?.nomeOrgao ?? ""}
      codigoIbgeMunicipio={user?.codigoIbgeMunicipio ?? ""}
    />
  )
}
