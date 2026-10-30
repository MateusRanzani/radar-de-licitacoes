"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { usuarios } from "@/db/schema"
import { eq } from "drizzle-orm"

export interface PerfilState {
  ok: boolean
  erro?: string
}

export async function salvarPerfilOrgao(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, erro: "Não autenticado" }

  const cnpjRaw  = String(formData.get("cnpj_orgao") ?? "").trim()
  const nome     = String(formData.get("nome_orgao") ?? "").trim().slice(0, 200) || null
  const ibge     = String(formData.get("codigo_ibge_municipio") ?? "").trim() || null

  const cnpj = cnpjRaw.replace(/\D/g, "")
  if (cnpj && cnpj.length !== 14) {
    return { ok: false, erro: "CNPJ deve ter 14 dígitos" }
  }
  if (ibge && !/^\d{7}$/.test(ibge)) {
    return { ok: false, erro: "Código IBGE deve ter 7 dígitos" }
  }

  await db
    .update(usuarios)
    .set({
      cnpjOrgao:           cnpj || null,
      nomeOrgao:           nome,
      codigoIbgeMunicipio: ibge,
      atualizadoEm:        new Date(),
    })
    .where(eq(usuarios.id, session.user.id))

  return { ok: true }
}
