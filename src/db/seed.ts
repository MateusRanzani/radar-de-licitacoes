/**
 * Seed inicial: fontes, modalidades PNCP, categorias e localidades IBGE.
 * Execute com: npm run db:seed
 */
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"
import { fontes, modalidades, categorias, localidades } from "./schema"

const url = process.env.DATABASE_URL
if (!url) { console.error("DATABASE_URL não definida"); process.exit(1) }

const client = postgres(url, { max: 1, ssl: url.includes("neon.tech") ? "require" : false })
const db = drizzle(client, { schema })

// ─── Fontes ───────────────────────────────────────────────────────────────── //

const FONTES_SEED = [
  {
    slug: "pncp",
    nome: "PNCP — Portal Nacional de Contratações Públicas",
    status: "ativa" as const,
    descricao: "Integrador oficial do governo federal. Cobre ~80% das contratações públicas brasileiras.",
    docsUrl: "https://pncp.gov.br/api/consulta/v3/api-docs",
    cobertura: "Todo o Brasil — federal, estadual e municipal que aderiu ao PNCP",
    frequenciaSync: "a cada 2h",
  },
  {
    slug: "compras-gov",
    nome: "Compras.gov.br",
    status: "planejada" as const,
    descricao: "Portal de compras do governo federal (também transmite ao PNCP).",
    docsUrl: "https://www.gov.br/compras",
    cobertura: "Órgãos federais",
    frequenciaSync: null,
  },
  {
    slug: "bll",
    nome: "BLL — Bolsa de Licitações e Leilões",
    status: "planejada" as const,
    descricao: "Portal privado de licitações de estados e municípios.",
    cobertura: "Municípios e estados que usam BLL",
    frequenciaSync: null,
  },
]

// ─── Modalidades PNCP ─────────────────────────────────────────────────────── //
// Lista verificada no PNCP em out/2024

const MODALIDADES_SEED = [
  { id: 1,  nome: "Leilão - Eletrônico" },
  { id: 2,  nome: "Diálogo Competitivo" },
  { id: 3,  nome: "Concurso" },
  { id: 4,  nome: "Concorrência - Eletrônica" },
  { id: 5,  nome: "Concorrência - Presencial" },
  { id: 6,  nome: "Pregão - Eletrônico" },
  { id: 7,  nome: "Pregão - Presencial" },
  { id: 8,  nome: "Dispensa de Licitação" },
  { id: 9,  nome: "Inexigibilidade" },
  { id: 10, nome: "Manifestação de Interesse" },
  { id: 11, nome: "Pré-qualificação" },
  { id: 12, nome: "Credenciamento" },
  { id: 13, nome: "Leilão - Presencial" },
]

// ─── Categorias ───────────────────────────────────────────────────────────── //

const CATEGORIAS_SEED = [
  { slug: "ti-software",        nome: "TI e Software",              descricao: "Desenvolvimento, licenças, suporte de TI" },
  { slug: "saude",              nome: "Saúde",                      descricao: "Medicamentos, equipamentos, serviços de saúde" },
  { slug: "obras-engenharia",   nome: "Obras e Engenharia",         descricao: "Construção civil, reforma, manutenção predial" },
  { slug: "educacao",           nome: "Educação",                   descricao: "Material escolar, mobiliário, serviços educacionais" },
  { slug: "limpeza-conservacao", nome: "Limpeza e Conservação",     descricao: "Serviços de limpeza, jardinagem, controle de pragas" },
  { slug: "seguranca",          nome: "Segurança",                  descricao: "Vigilância patrimonial, monitoramento, armamento" },
  { slug: "transporte-logistica", nome: "Transporte e Logística",   descricao: "Veículos, fretes, combustível" },
  { slug: "alimentacao",        nome: "Alimentação",                descricao: "Alimentos, refeições, merenda escolar" },
  { slug: "consultoria-servicos", nome: "Consultoria e Serviços",   descricao: "Consultorias, assessorias, capacitação" },
  { slug: "mobiliario-equipamentos", nome: "Mobiliário e Equipamentos", descricao: "Móveis, eletrodomésticos, equipamentos de escritório" },
  { slug: "telecomunicacoes",   nome: "Telecomunicações",           descricao: "Internet, telefonia, infraestrutura de rede" },
  { slug: "energia",            nome: "Energia",                    descricao: "Fornecimento de energia, painéis solares" },
  { slug: "meio-ambiente",      nome: "Meio Ambiente",              descricao: "Coleta de resíduos, saneamento, parques" },
  { slug: "publicidade-impressao", nome: "Publicidade e Impressão", descricao: "Gráfica, marketing institucional, divulgação" },
  { slug: "juridico",           nome: "Jurídico",                   descricao: "Assessoria jurídica, processos, compliance" },
  { slug: "outros",             nome: "Outros",                     descricao: "Categorias não enquadradas nas demais" },
]

// ─── Localidades IBGE via API ─────────────────────────────────────────────── //

const REGIOES: Record<string, string> = {
  AC:"Norte", AL:"Nordeste", AM:"Norte", AP:"Norte", BA:"Nordeste",
  CE:"Nordeste", DF:"Centro-Oeste", ES:"Sudeste", GO:"Centro-Oeste",
  MA:"Nordeste", MG:"Sudeste", MS:"Centro-Oeste", MT:"Centro-Oeste",
  PA:"Norte", PB:"Nordeste", PE:"Nordeste", PI:"Nordeste", PR:"Sul",
  RJ:"Sudeste", RN:"Nordeste", RO:"Norte", RR:"Norte", RS:"Sul",
  SC:"Sul", SE:"Nordeste", SP:"Sudeste", TO:"Norte",
}

async function fetchMunicipios() {
  console.log("  Buscando municípios na API do IBGE...")
  const res = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    { signal: AbortSignal.timeout(30_000) }
  )
  if (!res.ok) throw new Error(`IBGE API ${res.status}`)
  const data = await res.json() as Array<{
    id: number
    nome: string
    microrregiao?: { mesorregiao?: { UF?: { sigla: string } } } | null
    "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla: string } } } | null
  }>
  return data.flatMap((m) => {
    // Tenta microrregiao → mesorregiao → UF
    const uf = m.microrregiao?.mesorregiao?.UF?.sigla
      ?? (m as Record<string, unknown> & { "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla?: string } } } })["regiao-imediata"]?.["regiao-intermediaria"]?.["UF"]?.["sigla"]
    if (!uf) return [] // pula se não conseguir determinar UF
    return [{ codigoIbge: String(m.id), municipio: m.nome, uf, regiao: REGIOES[uf] ?? null }]
  })
}

// ─── Main ──────────────────────────────────────────────────────────────────── //

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n")

  // Fontes
  console.log("→ Fontes de dados...")
  await db.insert(fontes).values(FONTES_SEED).onConflictDoNothing()
  console.log(`  ✓ ${FONTES_SEED.length} fontes`)

  // Modalidades
  console.log("→ Modalidades PNCP...")
  await db.insert(modalidades).values(MODALIDADES_SEED).onConflictDoNothing()
  console.log(`  ✓ ${MODALIDADES_SEED.length} modalidades`)

  // Categorias
  console.log("→ Categorias...")
  await db.insert(categorias).values(CATEGORIAS_SEED).onConflictDoNothing()
  console.log(`  ✓ ${CATEGORIAS_SEED.length} categorias`)

  // Localidades IBGE
  console.log("→ Localidades IBGE...")
  try {
    const municipios = await fetchMunicipios()
    // Insere em lotes de 500 para não travar
    let total = 0
    for (let i = 0; i < municipios.length; i += 500) {
      const lote = municipios.slice(i, i + 500)
      await db.insert(localidades).values(lote).onConflictDoNothing()
      total += lote.length
      process.stdout.write(`\r  → ${total}/${municipios.length} municípios...`)
    }
    console.log(`\n  ✓ ${total} localidades`)
  } catch (err) {
    console.warn("  ⚠ IBGE API indisponível, localidades não populadas:", (err as Error).message)
  }

  console.log("\n✅ Seed concluído!")
  await client.end()
}

main().catch((err) => {
  console.error("Erro no seed:", err)
  process.exit(1)
})
