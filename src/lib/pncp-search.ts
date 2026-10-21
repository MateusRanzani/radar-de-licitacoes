// Busca textual do portal PNCP (/api/search) — não documentada oficialmente.
// Parâmetros e campos verificados em 2026-10-20: ver docs/fontes/pncp.md.
// Chamada a partir do navegador (CORS liberado): o servidor do PNCP derruba
// boa parte das chamadas feitas fora de navegador.

const BASE = "https://pncp.gov.br/api/search/"
export const TAM_PAGINA = 20
const TENTATIVAS = 3

export type Ordenacao = "relevancia" | "-data" | "data"
export type Esfera = "F" | "E" | "M" | "D"

export interface FiltrosBusca {
  q: string
  ufs: string[]
  esferas: Esfera[]
  modalidades: string[]
  ordenacao: Ordenacao
  pagina: number
}

export interface EditalBusca {
  numero_controle_pncp: string
  title: string | null
  description: string | null
  orgao_cnpj: string
  orgao_nome: string | null
  unidade_nome: string | null
  ano: string
  numero_sequencial: string
  uf: string | null
  municipio_nome: string | null
  esfera_id: string | null
  modalidade_licitacao_id: string | null
  modalidade_licitacao_nome: string | null
  situacao_id: string | null
  situacao_nome: string | null
  valor_total_estimado: number | null
  indicador_orcamento_sigiloso: boolean | null
  srp: boolean | null
  data_publicacao_pncp: string | null
  // Em editais: inicio_vigencia = abertura e fim_vigencia = encerramento de propostas
  data_inicio_vigencia: string | null
  data_fim_vigencia: string | null
  usuario_nome: string | null
}

export interface ResultadoBusca {
  items: EditalBusca[]
  total: number
}

export const ESFERAS: { id: Esfera; nome: string }[] = [
  { id: "F", nome: "Federal" },
  { id: "E", nome: "Estadual" },
  { id: "M", nome: "Municipal" },
  { id: "D", nome: "Distrital" },
]

export const ORDENACOES: { id: Ordenacao; nome: string }[] = [
  { id: "relevancia", nome: "Mais relevantes" },
  { id: "-data",      nome: "Publicação mais recente" },
  { id: "data",       nome: "Publicação mais antiga" },
]

const lista = (v: string | null) => (v ? v.split(",").filter(Boolean) : [])

export function filtrosDaUrl(params: URLSearchParams): FiltrosBusca {
  const ordem = params.get("ordem")
  return {
    q:           params.get("q")?.trim() ?? "",
    ufs:         lista(params.get("uf")),
    esferas:     lista(params.get("esfera")).filter((e): e is Esfera => ESFERAS.some((x) => x.id === e)),
    modalidades: lista(params.get("modalidade")),
    ordenacao:   ordem === "-data" || ordem === "data" ? ordem : "relevancia",
    pagina:      Math.max(1, parseInt(params.get("pagina") ?? "1", 10) || 1),
  }
}

export function montarUrlBusca(f: FiltrosBusca): string {
  const p = new URLSearchParams({
    tipos_documento: "edital",
    status:          "recebendo_proposta",
    pagina:          String(f.pagina),
    tam_pagina:      String(TAM_PAGINA),
  })
  if (f.q)                  p.set("q", f.q)
  if (f.ufs.length)         p.set("ufs", f.ufs.join("|"))
  if (f.esferas.length)     p.set("esferas", f.esferas.join("|"))
  if (f.modalidades.length) p.set("modalidades", f.modalidades.join("|"))
  if (f.ordenacao !== "relevancia") p.set("ordenacao", f.ordenacao)
  return `${BASE}?${p.toString()}`
}

export async function buscarEditais(f: FiltrosBusca, signal: AbortSignal): Promise<ResultadoBusca> {
  const url = montarUrlBusca(f)
  let ultimoErro: unknown
  for (let i = 0; i < TENTATIVAS; i++) {
    try {
      const res = await fetch(url, { signal, headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(`PNCP respondeu HTTP ${res.status}`)
      const json = (await res.json()) as ResultadoBusca
      return { items: json.items ?? [], total: json.total ?? 0 }
    } catch (err) {
      if (signal.aborted) throw err
      ultimoErro = err
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error("Falha ao consultar o PNCP")
}

/** Id usado na rota de detalhe: "cnpj_ano_seq" */
export function idDetalhe(e: EditalBusca): string {
  return `${e.orgao_cnpj}_${parseInt(e.ano, 10)}_${parseInt(e.numero_sequencial, 10)}`
}
