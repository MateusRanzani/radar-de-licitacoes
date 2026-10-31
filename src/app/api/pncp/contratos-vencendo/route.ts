import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const PNCP_BASE = "https://pncp.gov.br/api/consulta"
const TAMANHO_PAGINA = 50
const MAX_PAGINAS = 20
// O PNCP serve página fria em ~9–35 s e a mesma URL quente em ~0,1 s (cache deles).
// Sem teto por requisição a rota pendurava indefinidamente.
const TIMEOUT_REQ_MS = 30_000
// Teto total: devolve o que já tem em vez de estourar o limite da função.
const ORCAMENTO_MS = 45_000
// Acima de ~4 simultâneas o PNCP estrangula e o ganho some.
const CONCORRENCIA = 4

function dataAAAAMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

interface PaginaPncp {
  data: PncpContrato[]
  totalPaginas: number
}

async function buscarPagina(
  cnpj: string, inicio: string, fim: string, pagina: number, timeoutMs: number,
): Promise<PaginaPncp> {
  const url = `${PNCP_BASE}/v1/contratos?dataInicial=${inicio}&dataFinal=${fim}&cnpjOrgao=${cnpj}&pagina=${pagina}&tamanhoPagina=${TAMANHO_PAGINA}`
  const resp = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 1800 },
  })
  if (resp.status === 404 || resp.status === 204) return { data: [], totalPaginas: 0 }
  if (!resp.ok) {
    throw new Error(`PNCP retornou ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
  }
  const json = await resp.json()
  return { data: json.data ?? [], totalPaginas: json.totalPaginas ?? 1 }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const cnpj = searchParams.get("cnpj")?.replace(/\D/g, "")
  const dias = Math.min(90, Math.max(7, parseInt(searchParams.get("dias") ?? "90", 10)))

  if (!cnpj || cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 })
  }

  const hoje = new Date()
  const limite = new Date(hoje)
  limite.setDate(hoje.getDate() + dias)

  // O endpoint filtra por dataPublicacaoPncp — busca último ano de publicações
  const fim = dataAAAAMMDD(hoje)
  const inicio365 = new Date(hoje)
  inicio365.setDate(hoje.getDate() - 365)
  const inicio = dataAAAAMMDD(inicio365)

  const prazoFinal = Date.now() + ORCAMENTO_MS
  const brutos: PncpContrato[] = []
  let paginasConsultadas = 0
  let totalPaginas = 1

  // Cada requisição também é limitada pelo que resta do orçamento, senão um
  // lote iniciado pouco antes do prazo estoura o teto total da rota.
  const restante = () => Math.min(TIMEOUT_REQ_MS, prazoFinal - Date.now())

  try {
    const primeira = await buscarPagina(cnpj, inicio, fim, 1, TIMEOUT_REQ_MS)
    brutos.push(...primeira.data)
    paginasConsultadas = 1
    totalPaginas = Math.max(primeira.totalPaginas, 1)
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao consultar PNCP: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    )
  }

  // Páginas restantes em lotes paralelos. allSettled preserva as páginas que
  // deram certo quando uma do mesmo lote estoura o tempo.
  const ultima = Math.min(totalPaginas, MAX_PAGINAS)
  for (let p = 2; p <= ultima && restante() > 1_000; p += CONCORRENCIA) {
    const lote: number[] = []
    for (let i = 0; i < CONCORRENCIA && p + i <= ultima; i++) lote.push(p + i)

    const timeoutLote = restante()
    const resultados = await Promise.allSettled(
      lote.map((n) => buscarPagina(cnpj, inicio, fim, n, timeoutLote)),
    )
    for (const r of resultados) {
      if (r.status === "fulfilled") {
        brutos.push(...r.value.data)
        paginasConsultadas++
      }
    }
  }

  const contratosVencendo: ContratoVencendo[] = []
  for (const c of brutos) {
    if (!c.dataVigenciaFim) continue
    const vigFim = new Date(c.dataVigenciaFim + "T00:00:00-03:00")
    if (vigFim >= hoje && vigFim <= limite) {
      contratosVencendo.push({
        numeroControlePNCP: c.numeroControlePNCP ?? null,
        objetoContrato:     c.objetoContrato ?? "Não informado",
        fornecedor:         c.nomeRazaoSocialFornecedor ?? "Não informado",
        valorGlobal:        typeof c.valorGlobal === "number" ? c.valorGlobal : null,
        dataVigenciaFim:    c.dataVigenciaFim,
        dataAssinatura:     c.dataAssinatura ?? null,
        diasRestantes:      Math.round((vigFim.getTime() - hoje.getTime()) / 86_400_000),
        processo:           c.processo ?? null,
      })
    }
  }

  contratosVencendo.sort((a, b) => a.diasRestantes - b.diasRestantes)

  return NextResponse.json({
    contratos: contratosVencendo,
    total: contratosVencendo.length,
    paginasConsultadas,
    totalPaginas,
    limitado: paginasConsultadas < totalPaginas,
    consultadoEm: new Date().toISOString(),
  })
}

interface PncpContrato {
  numeroControlePNCP?: string
  objetoContrato?: string
  nomeRazaoSocialFornecedor?: string
  valorGlobal?: number | null
  dataVigenciaFim?: string
  dataAssinatura?: string
  processo?: string
}

interface ContratoVencendo {
  numeroControlePNCP: string | null
  objetoContrato: string
  fornecedor: string
  valorGlobal: number | null
  dataVigenciaFim: string
  dataAssinatura: string | null
  diasRestantes: number
  processo: string | null
}
