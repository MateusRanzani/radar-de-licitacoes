// Busca preços de homologação no PNCP para cotação.
// Chamada do navegador — CORS * em /api/search/ e /api/pncp/*.
// Verificado em 2026-10-21. Ver docs/COTACAO.md.

const BASE_SEARCH = "https://pncp.gov.br/api/search/"
const BASE_API    = "https://pncp.gov.br/api/pncp"
const TENTATIVAS  = 3

export interface FiltrosCotacao {
  q:     string
  meses: number  // período retroativo a partir de hoje
}

export interface PrecoCotacao {
  id:                 string   // "cnpj_ano_seq_item_cnpjFornecedor"
  numeroControlePNCP: string
  cnpj:               string
  ano:                number
  seq:                number
  numeroItem:         number
  descricao:          string
  unidade:            string
  quantidade:         number
  valorUnitario:      number   // 4 casas decimais da fonte; converter para bigint na estatística
  fornecedor:         string
  cnpjFornecedor:     string
  dataResultado:      string   // YYYY-MM-DD
  orgaoNome:          string
  uf:                 string
  modalidade:         string
  esfera:             string
  linkPNCP:           string
  consultadoEm:       string   // ISO timestamp da consulta
}

// ─── Tipos internos da API ────────────────────────────────────────────────── //

interface EditalSearchRaw {
  numero_controle_pncp:      string
  orgao_cnpj:                string
  ano:                       string
  numero_sequencial:         string
  tem_resultado:             boolean
  modalidade_licitacao_nome: string | null
  orgao_nome:                string | null
  uf:                        string | null
  esfera_id:                 string | null
}

interface ItemRaw {
  numeroItem:             number
  descricao:              string
  unidadeMedida:          string
  quantidade:             number
  temResultado:           boolean
  situacaoCompraItemNome: string
}

interface ResultadoRaw {
  valorUnitarioHomologado:   number
  nomeRazaoSocialFornecedor: string
  niFornecedor:              string
  dataResultado:             string
}

// ─── HTTP com retry ───────────────────────────────────────────────────────── //

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < TENTATIVAS; i++) {
    try {
      const r = await fetch(url, { signal, headers: { Accept: "application/json" } })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<T>
    } catch (err) {
      if (signal.aborted) throw err
      lastErr = err
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Falha na consulta")
}

// ─── Pool de concorrência ─────────────────────────────────────────────────── //

async function pool<T>(
  fns: (() => Promise<T>)[],
  concorrencia: number,
): Promise<void> {
  let next = 0
  async function worker() {
    while (next < fns.length) {
      const idx = next++
      await fns[idx]().catch(() => {/* erros individuais ignorados, resultado parcial */ })
    }
  }
  await Promise.all(Array.from({ length: Math.min(concorrencia, fns.length) }, worker))
}

// ─── Busca principal ──────────────────────────────────────────────────────── //

export interface Progresso {
  mensagem:  string
  analisadas: number
  total:     number   // 0 enquanto a lista de compras não chegou
}

// Agrupa grafias da mesma apresentação ("UN", "Un", "UNID.", "Unidade") para o cálculo
const SINONIMOS_UNIDADE = new Set(["U", "UN", "UND", "UNID", "UNIDADE", "UNIDADES"])

export function grupoUnidade(unidade: string): string {
  const limpa = unidade.trim().replace(/\.$/, "")
  if (!limpa) return "Não informado"
  const upper = limpa.toLocaleUpperCase("pt-BR")
  if (SINONIMOS_UNIDADE.has(upper)) return "Unidade"
  return upper.charAt(0) + upper.slice(1).toLocaleLowerCase("pt-BR")
}

export async function buscarPrecos(
  filtros:            FiltrosCotacao,
  signal:             AbortSignal,
  onProgresso:        (p: Progresso) => void,
  onPrecoEncontrado?: (p: PrecoCotacao) => void,
): Promise<PrecoCotacao[]> {
  const agora      = new Date().toISOString()
  const dataInicio = new Date()
  dataInicio.setMonth(dataInicio.getMonth() - filtros.meses)
  const dataInicioStr = dataInicio.toISOString().slice(0, 10)  // YYYY-MM-DD

  // 1. Buscar editais com o termo
  onProgresso({ mensagem: "Buscando compras no PNCP…", analisadas: 0, total: 0 })
  const sp = new URLSearchParams({
    q:               filtros.q,
    tipos_documento: "edital",
    status:          "todos",
    pagina:          "1",
    tam_pagina:      "50",
  })

  const { items } = await fetchJson<{ items: EditalSearchRaw[]; total: number }>(
    `${BASE_SEARCH}?${sp}`,
    signal,
  )

  // Só interessam editais com vencedor já homologado
  const comResultado = items.filter((e) => e.tem_resultado)
  if (comResultado.length === 0) return []

  // 2. Para cada edital, buscar itens e resultados em paralelo (até 4 simultâneos)
  const precos: PrecoCotacao[] = []
  const total = comResultado.length
  let analisadas = 0
  onProgresso({ mensagem: `${total} compras com resultado — analisando itens…`, analisadas, total })

  const tarefas = comResultado.map((edital) => async () => {
    try {
      await analisarEdital(edital)
    } finally {
      analisadas++
      if (!signal.aborted) {
        onProgresso({ mensagem: `Analisando compras… ${edital.orgao_nome ?? ""}`.trim(), analisadas, total })
      }
    }
  })

  async function analisarEdital(edital: EditalSearchRaw) {
    const cnpj = edital.orgao_cnpj
    const ano  = parseInt(edital.ano, 10)
    const seq  = parseInt(edital.numero_sequencial, 10)
    if (!cnpj || isNaN(ano) || isNaN(seq)) return

    // Itens da compra
    const itens = await fetchJson<ItemRaw[]>(
      `${BASE_API}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens?pagina=1&tamanhoPagina=100`,
      signal,
    ).catch((): ItemRaw[] => [])

    // Filtrar itens pela palavra buscada (todos os termos devem aparecer na descrição)
    const termos = filtros.q.toLowerCase().split(/\s+/).filter(Boolean)
    const relevantes = itens.filter((item) => {
      if (!item.temResultado) return false
      const desc = item.descricao.toLowerCase()
      return termos.every((t) => desc.includes(t))
    })
    if (relevantes.length === 0) return

    // Resultados de cada item relevante
    for (const item of relevantes) {
      const resultados = await fetchJson<ResultadoRaw[]>(
        `${BASE_API}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens/${item.numeroItem}/resultados`,
        signal,
      ).catch((): ResultadoRaw[] => [])

      for (const r of resultados) {
        if (!r.valorUnitarioHomologado || r.valorUnitarioHomologado <= 0) continue
        // Filtro de período aplicado no resultado (dataResultado = data de homologação)
        if (r.dataResultado < dataInicioStr) continue

        const preco: PrecoCotacao = {
          id:                 `${cnpj}_${ano}_${seq}_${item.numeroItem}_${r.niFornecedor}`,
          numeroControlePNCP: edital.numero_controle_pncp,
          cnpj, ano, seq,
          numeroItem:         item.numeroItem,
          descricao:          item.descricao,
          unidade:            item.unidadeMedida,
          quantidade:         item.quantidade,
          valorUnitario:      r.valorUnitarioHomologado,
          fornecedor:         r.nomeRazaoSocialFornecedor,
          cnpjFornecedor:     r.niFornecedor,
          dataResultado:      r.dataResultado,
          orgaoNome:          edital.orgao_nome ?? "Não informado",
          uf:                 edital.uf ?? "Não informado",
          modalidade:         edital.modalidade_licitacao_nome ?? "Não informado",
          esfera:             edital.esfera_id ?? "Não informado",
          linkPNCP:           `https://pncp.gov.br/app/editais/${cnpj}/${ano}/${seq}`,
          consultadoEm:       agora,
        }
        precos.push(preco)
        if (!signal.aborted) onPrecoEncontrado?.(preco)
      }
    }
  }

  await pool(tarefas, 4)
  // Mais recentes primeiro
  return precos.sort((a, b) => (a.dataResultado < b.dataResultado ? 1 : -1))
}
