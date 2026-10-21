"use server"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { signIn, signOut } from "@/auth"
import { db } from "@/db"
import { usuarios } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export interface ActionResult {
  error?: string
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email:      formData.get("email"),
      password:   formData.get("password"),
      redirectTo: "/licitacoes",
    })
    return {}
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: "E-mail ou senha inválidos." }
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}

export async function cadastrarAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const nome  = String(formData.get("nome") ?? "").trim()
  const email = String(formData.get("email") ?? "").toLowerCase().trim()
  const senha = String(formData.get("senha") ?? "")
  const confirmacao = String(formData.get("confirmacao") ?? "")

  if (!email || !senha) return { error: "E-mail e senha são obrigatórios." }
  if (senha.length < 8) return { error: "A senha deve ter pelo menos 8 caracteres." }
  if (senha !== confirmacao) return { error: "As senhas não coincidem." }

  const [existing] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1)

  if (existing) return { error: "Este e-mail já está cadastrado." }

  const senhaHash = await bcrypt.hash(senha, 12)

  await db.insert(usuarios).values({
    email,
    nome:      nome || null,
    senhaHash,
    papel:     "usuario",
  })

  try {
    await signIn("credentials", {
      email,
      password:   senha,
      redirectTo: "/licitacoes",
    })
    return {}
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: "Conta criada. Faça login para continuar." }
  }
}
