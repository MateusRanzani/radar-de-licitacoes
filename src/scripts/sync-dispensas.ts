/**
 * Sync do histórico de dispensas (modalidade 8) dos órgãos monitorados.
 * Alimenta o Radar de Fracionamento, que precisa das dispensas encerradas —
 * o sync principal só traz contratações com proposta aberta.
 *
 * Uso: npm run sync:dispensas                      (CNPJs dos perfis de usuário)
 *      npm run sync:dispensas -- --cnpj=47970769000104
 *      npm run sync:dispensas -- --ano=2025
 */
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { isNotNull } from "drizzle-orm"
import * as schema from "../db/schema"
import { usuarios } from "../db/schema"
import { syncDispensasOrgaos } from "../lib/sync/pncp-sync"

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? "true"] })
)

const url = process.env.DATABASE_URL
if (!url) { console.error("DATABASE_URL não definida"); process.exit(1) }

const client = postgres(url, {
  max: 3, idle_timeout: 20, connect_timeout: 10,
  ssl: url.includes("neon.tech") ? "require" : false,
})
const db = drizzle(client, { schema })

async function main() {
  const ano = args.ano ? parseInt(args.ano) : new Date().getFullYear()

  let cnpjs: string[]
  if (args.cnpj) {
    cnpjs = [args.cnpj.replace(/\D/g, "")]
  } else {
    const rows = await db
      .selectDistinct({ cnpj: usuarios.cnpjOrgao })
      .from(usuarios)
      .where(isNotNull(usuarios.cnpjOrgao))
    cnpjs = rows.map(r => r.cnpj!).filter(c => c.length === 14)
  }

  if (cnpjs.length === 0) {
    console.log("Nenhum órgão monitorado. Configure o CNPJ no perfil ou passe --cnpj=")
    return
  }

  console.log(`🔄 Dispensas ${ano} — ${cnpjs.length} órgão(s): ${cnpjs.join(", ")}`)
  try {
    const result = await syncDispensasOrgaos({ db, cnpjs, ano, verbose: true })
    console.log("\nResultado:", result)
  } finally {
    await client.end()
  }
}

main().catch(err => { console.error("Erro no sync:", err); process.exit(1) })
