import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const PNCP_BASE = "https://pncp.gov.br/api/consulta"
const TAMANHO_PAGINA = 50
const MAX_PAGINAS = 6 // 300 contratos por consulta max

function dataAAAAMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "")
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

  const contratosVencendo: ContratoVencendo[] = []
  let pagina = 1

  try {
    while (pagina <= MAX_PAGINAS) {
      const url = `${PNCP_BASE}/v1/contratos?dataInicial=${inicio}&dataFinal=${fim}&cnpjOrgao=${cnpj}&pagina=${pagina}&tamanhoPagina=${TAMANHO_PAGINA}`

      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 1800 }, // 30min cache
      })

      if (!resp.ok) {
        if (resp.status === 404 || resp.status === 204) break
        const body = await resp.text()
        return NextResponse.json({ error: `PNCP retornou ${resp.status}: ${body.slice(0, 200)}` }, { status: 502 })
      }

      const json = await resp.json()
      const items: PncpContrato[] = json.data ?? []

      for (const c of items) {
        if (!c.dataVigenciaFim) continue
        const vigFim = new Date(c.dataVigenciaFim + "T00:00:00-03:00")
        if (vigFim >= hoje && vigFim <= limite) {
          const diasRestantes = Math.round((vigFim.getTime() - hoje.getTime()) / 86_400_000)
          contratosVencendo.push({
            numeroControlePNCP: c.numeroControlePNCP ?? null,
            objetoContrato:     c.objetoContrato ?? "Não informado",
            fornecedor:         c.nomeRazaoSocialFornecedor ?? "Não informado",
            valorGlobal:        typeof c.valorGlobal === "number" ? c.valorGlobal : null,
            dataVigenciaFim:    c.dataVigenciaFim,
            dataAssinatura:     c.dataAssinatura ?? null,
            diasRestantes,
            processo:           c.processo ?? null,
          })
        }
      }

      if (pagina >= (json.totalPaginas ?? 1)) break
      pagina++
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao consultar PNCP: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    )
  }

  contratosVencendo.sort((a, b) => a.diasRestantes - b.diasRestantes)

  return NextResponse.json({
    contratos: contratosVencendo,
    total: contratosVencendo.length,
    paginasConsultadas: pagina,
    limitado: pagina >= MAX_PAGINAS,
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
