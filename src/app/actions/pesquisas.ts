"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db"
import { pesquisasSalvas } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export interface PesquisaState {
  ok: boolean
  erro?: string
}

export async function salvarPesquisa(
  _prev: PesquisaState,
  formData: FormData,
): Promise<PesquisaState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const nome       = (formData.get("nome") as string | null)?.trim() ?? ""
  const q          = (formData.get("q") as string | null)?.trim() ?? ""
  const uf         = (formData.get("uf") as string | null)?.trim() ?? ""
  const modalidade = formData.get("modalidade")
  const frequencia = (formData.get("frequencia") as string | null) ?? "diaria"

  if (!nome) return { ok: false, erro: "Informe um nome para a pesquisa." }
  if (!q && !uf && !modalidade)
    return { ok: false, erro: "Defina ao menos um critério (palavra-chave, UF ou modalidade)." }

  const filtros: Record<string, unknown> = { pagina: 1 }
  if (q) filtros.q = q
  if (uf) filtros.uf = uf
  if (modalidade) filtros.modalidade = parseInt(modalidade as string, 10)

  await db.insert(pesquisasSalvas).values({
    userId:    session.user.id,
    nome,
    filtros,
    frequencia,
    ativa: true,
  })

  revalidatePath("/acompanhamento")
  return { ok: true }
}

export async function deletarPesquisa(id: bigint): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await db
    .delete(pesquisasSalvas)
    .where(
      and(
        eq(pesquisasSalvas.id, id),
        eq(pesquisasSalvas.userId, session.user.id),
      )
    )

  revalidatePath("/acompanhamento")
}

export async function togglePesquisa(id: bigint, ativa: boolean): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await db
    .update(pesquisasSalvas)
    .set({ ativa })
    .where(
      and(
        eq(pesquisasSalvas.id, id),
        eq(pesquisasSalvas.userId, session.user.id),
      )
    )

  revalidatePath("/acompanhamento")
}
