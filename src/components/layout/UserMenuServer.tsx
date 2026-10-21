import { connection } from "next/server"
import { auth } from "@/auth"
import { UserMenuClient } from "./UserMenuClient"

export async function UserMenuServer() {
  await connection()
  const session = await auth()
  return (
    <UserMenuClient
      usuario={session?.user
        ? { nome: session.user.name ?? session.user.email ?? "Usuário", email: session.user.email ?? "" }
        : null}
    />
  )
}
