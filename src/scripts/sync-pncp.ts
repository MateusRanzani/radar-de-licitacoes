/**
 * CLI para sync PNCP.
 * Uso: npm run sync:pncp
 *      npm run sync:pncp -- --maxPags=5   (para testar)
 *      npm run sync:pncp -- --verbose
 */
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "../db/schema"
import { syncPncp } from "../lib/sync/pncp-sync"

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => {
      const [k, v] = a.slice(2).split("=")
      return [k, v ?? "true"]
    })
)

const url = process.env.DATABASE_URL
if (!url) { console.error("DATABASE_URL não definida"); process.exit(1) }

const client = postgres(url, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: url.includes("neon.tech") ? "require" : false,
})
const db = drizzle(client, { schema })

async function main() {
  const maxPags = args.maxPags ? parseInt(args.maxPags) : undefined
  const verbose = args.verbose === "true" || !maxPags // verbose por padrão em modo completo

  console.log("🔄 Iniciando sync PNCP...")
  if (maxPags) console.log(`   (modo teste: máx ${maxPags} páginas)`)

  try {
    const result = await syncPncp({ db, verbose, maxPags })
    console.log("\nResultado:", result)
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error("Erro no sync:", err)
  process.exit(1)
})
