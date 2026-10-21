import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL não definida")

// max: 1 é seguro para serverless (Vercel) — evita abrir muitas conexões
const client = postgres(url, {
  max: process.env.NODE_ENV === "production" ? 5 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: url.includes("neon.tech") ? "require" : false,
})

export const db = drizzle(client, { schema })
export type DB = typeof db
