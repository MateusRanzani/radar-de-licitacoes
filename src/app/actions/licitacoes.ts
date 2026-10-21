"use server"
import { auth } from "@/auth"
import { db } from "@/db"
import {
  favoritos, anotacoes, statusPessoal,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function exigirAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autenticado")
  return session.user.id
}

// ─── Favoritos ────────────────────────────────────────────────────────────── //

export async function toggleFavorito(contratacaoId: bigint) {
  const userId = await exigirAuth()

  const [existente] = await db
    .select({ id: favoritos.id })
    .from(favoritos)
    .where(and(eq(favoritos.userId, userId), eq(favoritos.contratacaoId, contratacaoId)))
    .limit(1)

  if (existente) {
    await db.delete(favoritos).where(eq(favoritos.id, existente.id))
  } else {
    await db.insert(favoritos).values({ userId, contratacaoId })
  }

  revalidatePath("/acompanhamento")
  return { favoritado: !existente }
}

// ─── Anotações ────────────────────────────────────────────────────────────── //

export async function salvarAnotacao(contratacaoId: bigint, conteudo: string) {
  const userId = await exigirAuth()

  if (!conteudo.trim()) {
    await db
      .delete(anotacoes)
      .where(and(eq(anotacoes.userId, userId), eq(anotacoes.contratacaoId, contratacaoId)))
    return
  }

  const [existente] = await db
    .select({ id: anotacoes.id })
    .from(anotacoes)
    .where(and(eq(anotacoes.userId, userId), eq(anotacoes.contratacaoId, contratacaoId)))
    .limit(1)

  if (existente) {
    await db.update(anotacoes)
      .set({ conteudo: conteudo.trim(), atualizadoEm: new Date() })
      .where(eq(anotacoes.id, existente.id))
  } else {
    await db.insert(anotacoes).values({ userId, contratacaoId, conteudo: conteudo.trim() })
  }

  revalidatePath("/acompanhamento")
}

// ─── Status pessoal ───────────────────────────────────────────────────────── //

export type StatusPessoalValor = "nova" | "analisar" | "interessante" | "participar" | "descartada"

export async function definirStatus(contratacaoId: bigint, status: StatusPessoalValor | null) {
  const userId = await exigirAuth()

  if (!status) {
    await db
      .delete(statusPessoal)
      .where(and(eq(statusPessoal.userId, userId), eq(statusPessoal.contratacaoId, contratacaoId)))
    revalidatePath("/acompanhamento")
    return
  }

  await db
    .insert(statusPessoal)
    .values({ userId, contratacaoId, status })
    .onConflictDoUpdate({
      target: [statusPessoal.userId, statusPessoal.contratacaoId],
      set: { status },
    })

  revalidatePath("/acompanhamento")
}
