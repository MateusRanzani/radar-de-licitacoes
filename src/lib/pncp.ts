import "server-only"
import type {
  PncpContratacao,
  PncpPaginado,
  PncpItem,
  PncpArquivo,
  PncpHistorico,
  PncpModalidade,
} from "./types"

// ─── Constantes verificadas em 2026-10-20 ────────────────────────────────── //
const BASE_CONSULTA = "https://pncp.gov.br/api/consulta"
const BASE_API      = "https://pncp.gov.br/api/pncp"
const MAX_PAGE_SIZE = 50   // tamanhoPagina > 50 retorna HTTP 400
const TIMEOUT_MS    = 30_000

// ─── HTTP helper ─────────────────────────────────────────────────────────── //
async function pncpFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: {
        "Accept":       "application/json",
        "User-Agent":   "LicitaRadar/0.1 (contato@licitaradar.com.br)",
        ...opts?.headers,
      },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new PncpError(res.status, url, body)
    }

    return res.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

export class PncpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body: string,
  ) {
    super(`PNCP ${status}: ${url} — ${body.slice(0, 200)}`)
    this.name = "PncpError"
  }
}

// ─── Helpers de data ─────────────────────────────────────────────────────── //

/** Formata Date → YYYYMMDD para os parâmetros da API */
function toDataParam(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(/-/g, "")
}

/** Data de hoje no fuso de Brasília, como YYYYMMDD */
export function hojeParam(): string {
  return toDataParam(new Date())
}

// ─── Contratações com proposta em aberto ─────────────────────────────────── //
// GET /v1/contratacoes/proposta
// Params obrigatórios: dataFinal (YYYYMMDD), pagina
// tamanhoPagina: máx 50
// codigoModalidadeContratacao, uf: opcionais

export interface ListarPropostasOpts {
  pagina?: number
  uf?: string
  modalidade?: number
  tamanhoPagina?: number
}

export async function listarPropostas(opts: ListarPropostasOpts = {}): Promise<PncpPaginado<PncpContratacao>> {
  const p = new URLSearchParams({
    dataFinal:    hojeParam(),
    pagina:       String(opts.pagina ?? 1),
    tamanhoPagina: String(Math.min(opts.tamanhoPagina ?? 20, MAX_PAGE_SIZE)),
  })
  if (opts.uf)        p.set("uf", opts.uf)
  if (opts.modalidade) p.set("codigoModalidadeContratacao", String(opts.modalidade))

  return pncpFetch<PncpPaginado<PncpContratacao>>(
    `${BASE_CONSULTA}/v1/contratacoes/proposta?${p}`,
    { cache: "no-store" },
  )
}

// ─── Detalhe de uma contratação ──────────────────────────────────────────── //
// GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}

export async function buscarContratacao(cnpj: string, ano: number, seq: number): Promise<PncpContratacao> {
  return pncpFetch<PncpContratacao>(
    `${BASE_CONSULTA}/v1/orgaos/${cnpj}/compras/${ano}/${seq}`,
    { next: { revalidate: 300 } }, // 5 min — dados não mudam rápido
  )
}

// ─── Itens ───────────────────────────────────────────────────────────────── //
export async function buscarItens(cnpj: string, ano: number, seq: number): Promise<PncpItem[]> {
  return pncpFetch<PncpItem[]>(
    `${BASE_API}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens`,
    { next: { revalidate: 300 } },
  )
}

// ─── Arquivos ────────────────────────────────────────────────────────────── //
export async function buscarArquivos(cnpj: string, ano: number, seq: number): Promise<PncpArquivo[]> {
  return pncpFetch<PncpArquivo[]>(
    `${BASE_API}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/arquivos`,
    { next: { revalidate: 300 } },
  )
}

// ─── Histórico ───────────────────────────────────────────────────────────── //
export async function buscarHistorico(cnpj: string, ano: number, seq: number): Promise<PncpHistorico[]> {
  return pncpFetch<PncpHistorico[]>(
    `${BASE_API}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/historico`,
    { next: { revalidate: 300 } },
  )
}

// ─── Modalidades (cache longo — tabela de domínio estável) ───────────────── //
export async function listarModalidades(): Promise<PncpModalidade[]> {
  return pncpFetch<PncpModalidade[]>(
    `${BASE_API}/v1/modalidades`,
    { next: { revalidate: 86400 } }, // 24h — tabela de domínio estável
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────── //

/** Converte o id "cnpj_ano_seq" (usado como param de URL) em partes */
export function parseContratacaoId(id: string): { cnpj: string; ano: number; seq: number } | null {
  const parts = id.split("_")
  if (parts.length !== 3) return null
  const [cnpj, anoStr, seqStr] = parts
  const ano = parseInt(anoStr, 10)
  const seq = parseInt(seqStr, 10)
  if (!cnpj || isNaN(ano) || isNaN(seq)) return null
  return { cnpj, ano, seq }
}

/** Constrói o id de URL a partir de uma contratação */
export function contratacaoId(c: PncpContratacao): string {
  return `${c.orgaoEntidade.cnpj}_${c.anoCompra}_${c.sequencialCompra}`
}

// UFs estão em src/lib/constants.ts para importação segura em Client Components
export type { UF } from "./constants"
