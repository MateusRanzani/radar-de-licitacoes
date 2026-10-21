/**
 * Conector de sync PNCP — propostas abertas.
 * Usa /v1/contratacoes/proposta (único endpoint sem filtro obrigatório de modalidade).
 * tamanhoPagina mínimo = 10, máximo = 50.
 */
import { createHash } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import {
  fontes, orgaos, unidadesOrgao, contratacoes, registrosFonte,
  historicoContratacao, syncExecucoes, syncCursores, syncErros,
} from "@/db/schema"
import type { PncpContratacao } from "@/lib/types"

const BASE_URL  = "https://pncp.gov.br/api/consulta"
const PAGE_SIZE = 50
const DELAY_MS  = 250
// Proposta exige dataFinal >= hoje; usamos +180 dias para pegar tudo aberto
const JANELA_DIAS = 180

// ─── Tipos ────────────────────────────────────────────────────────────────── //

export interface SyncOpts {
  db:       PostgresJsDatabase<Record<string, unknown>>
  verbose?: boolean
  maxPags?: number   // limite para testes
}

export interface SyncResult {
  inseridos:   number
  atualizados: number
  iguais:      number
  erros:       number
  paginas:     number
  duracaoMs:   number
}

// ─── Utilitários ──────────────────────────────────────────────────────────── //

function dataFuturo(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10).replace(/-/g, "")  // YYYYMMDD
}

function parsePncpTs(s: string | null | undefined): Date | null {
  if (!s) return null
  const cleaned = s.endsWith("Z") || s.includes("+") ? s : `${s}-03:00`
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

function hash(item: PncpContratacao): string {
  return createHash("sha256")
    .update(JSON.stringify({
      objeto:      item.objetoCompra,
      situacao:    item.situacaoCompraId,
      valorEst:    item.valorTotalEstimado,
      dataEnc:     item.dataEncerramentoProposta,
      dataAtual:   item.dataAtualizacaoGlobal ?? item.dataAtualizacao,
    }))
    .digest("hex")
    .slice(0, 16)
}

function deriveStatus(item: PncpContratacao): string {
  const enc = parsePncpTs(item.dataEncerramentoProposta)
  if (item.situacaoCompraId === 1 && enc && enc > new Date()) return "aberta_confirmada"
  if (item.situacaoCompraId !== 1) return "encerrada"
  return "indeterminada"
}

// ─── Retry com backoff ────────────────────────────────────────────────────── //

async function fetchComRetry(url: string, tentativas = 3): Promise<PncpPaginado> {
  let ultimo: Error | null = null
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      if (r.status === 429 || r.status >= 500) {
        const espera = 2 ** i * 1_000
        await new Promise(res => setTimeout(res, espera))
        ultimo = new Error(`HTTP ${r.status}`)
        continue
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
      return r.json() as Promise<PncpPaginado>
    } catch (e) {
      ultimo = e as Error
      if (i < tentativas - 1) await new Promise(res => setTimeout(res, 2 ** i * 1_000))
    }
  }
  throw ultimo ?? new Error("fetch falhou")
}

interface PncpPaginado {
  data:           PncpContratacao[]
  totalRegistros: number
  totalPaginas:   number
  numeroPagina:   number
  empty:          boolean
}

// ─── Upsert de entidades ──────────────────────────────────────────────────── //

async function upsertOrgao(
  db: SyncOpts["db"],
  item: PncpContratacao
): Promise<number> {
  const o = item.orgaoEntidade
  const [row] = await db
    .insert(orgaos)
    .values({
      cnpj:        o.cnpj,
      razaoSocial: o.razaoSocial,
      esfera:      o.esferaId,
      poderId:     o.poderId ?? null,
    })
    .onConflictDoUpdate({
      target: orgaos.cnpj,
      set:    { razaoSocial: sql`excluded.razao_social`, esfera: sql`excluded.esfera` },
    })
    .returning({ id: orgaos.id })
  return row.id
}

async function upsertUnidade(
  db: SyncOpts["db"],
  orgaoId: number,
  item: PncpContratacao
): Promise<number> {
  const u = item.unidadeOrgao
  const [row] = await db
    .insert(unidadesOrgao)
    .values({
      orgaoId,
      codigo:       u.codigoUnidade,
      nome:         u.nomeUnidade,
      ufSigla:      u.ufSigla ?? null,
      municipioNome: u.municipioNome ?? null,
      codigoIbge:   u.codigoIbge?.toString() ?? null,
    })
    .onConflictDoUpdate({
      target: [unidadesOrgao.orgaoId, unidadesOrgao.codigo],
      set:    { nome: sql`excluded.nome` },
    })
    .returning({ id: unidadesOrgao.id })
  return row.id
}

// ─── Upsert de contratação ────────────────────────────────────────────────── //

async function upsertContratacao(
  db: SyncOpts["db"],
  fonteId: number,
  item: PncpContratacao,
  orgaoId: number,
  unidadeOrgaoId: number,
): Promise<{ contratacaoId: bigint; mudou: boolean }> {
  const novoHash = hash(item)

  const amparoLegal = typeof item.amparoLegal === "object" && item.amparoLegal !== null
    ? (item.amparoLegal as { descricao?: string }).descricao ?? JSON.stringify(item.amparoLegal)
    : (item.amparoLegal as string | null) ?? null

  const row = {
    numeroControlePncp:       item.numeroControlePNCP,
    numero:                   item.numeroCompra       ?? null,
    processo:                 item.processo            ?? null,
    objeto:                   item.objetoCompra        ?? null,
    informacaoComplementar:   item.informacaoComplementar ?? null,
    orgaoId,
    unidadeOrgaoId,
    modalidadeId:             item.modalidadeId        ?? null,
    modoDisputa:              item.modoDisputaNome      ?? null,
    instrumento:              item.tipoInstrumentoConvocatorioNome ?? null,
    amparoLegal,
    srp:                      item.srp                 ?? false,
    esfera:                   item.orgaoEntidade.esferaId ?? null,
    valorEstimado:            item.valorTotalEstimado != null
                                ? String(item.valorTotalEstimado) : null,
    valorHomologado:          item.valorTotalHomologado != null
                                ? String(item.valorTotalHomologado) : null,
    orcamentoSigiloso:        false,
    situacaoId:               item.situacaoCompraId    ?? null,
    situacaoNome:             item.situacaoCompraNome  ?? null,
    statusDerivado:           deriveStatus(item),
    dataPublicacaoPncp:       parsePncpTs(item.dataPublicacaoPncp),
    dataAberturaProposta:     parsePncpTs(item.dataAberturaProposta),
    dataEncerramentoProposta: parsePncpTs(item.dataEncerramentoProposta),
    dataInclusao:             parsePncpTs(item.dataInclusao),
    dataAtualizacaoFonte:     parsePncpTs(item.dataAtualizacaoGlobal ?? item.dataAtualizacao),
    coletadoEm:               new Date(),
    hashConteudo:             novoHash,
  }

  // Busca hash atual para detectar mudança
  const [existente] = await db
    .select({ id: contratacoes.id, hashConteudo: contratacoes.hashConteudo })
    .from(contratacoes)
    .where(eq(contratacoes.numeroControlePncp, item.numeroControlePNCP))

  const [{ id: contratacaoId }] = await db
    .insert(contratacoes)
    .values(row)
    .onConflictDoUpdate({
      target: contratacoes.numeroControlePncp,
      set: {
        objeto:                   sql`excluded.objeto`,
        informacaoComplementar:   sql`excluded.informacao_complementar`,
        valorEstimado:            sql`excluded.valor_estimado`,
        valorHomologado:          sql`excluded.valor_homologado`,
        situacaoId:               sql`excluded.situacao_id`,
        situacaoNome:             sql`excluded.situacao_nome`,
        statusDerivado:           sql`excluded.status_derivado`,
        dataEncerramentoProposta: sql`excluded.data_encerramento_proposta`,
        dataAtualizacaoFonte:     sql`excluded.data_atualizacao_fonte`,
        coletadoEm:               sql`excluded.coletado_em`,
        hashConteudo:             sql`excluded.hash_conteudo`,
      },
    })
    .returning({ id: contratacoes.id })

  const mudou = !existente || existente.hashConteudo !== novoHash

  // Registra histórico se mudou
  if (mudou && existente) {
    await db.insert(historicoContratacao).values({
      contratacaoId,
      tipo:      "atualizacao",
      descricao: `Hash mudou: ${existente.hashConteudo} → ${novoHash}`,
    })
  }

  // Upsert registro_fonte (raw payload)
  await db
    .insert(registrosFonte)
    .values({
      fonteId,
      idExterno:     item.numeroControlePNCP,
      contratacaoId,
      urlOrigem:     item.linkSistemaOrigem ?? null,
      payloadBruto:  item as unknown as Record<string, unknown>,
      coletadoEm:    new Date(),
      atualizadoNaFonteEm: parsePncpTs(item.dataAtualizacaoGlobal ?? item.dataAtualizacao),
      hashConteudo:  novoHash,
    })
    .onConflictDoUpdate({
      target: [registrosFonte.fonteId, registrosFonte.idExterno],
      set: {
        payloadBruto:         sql`excluded.payload_bruto`,
        atualizadoNaFonteEm: sql`excluded.atualizado_na_fonte_em`,
        hashConteudo:         sql`excluded.hash_conteudo`,
      },
    })

  return { contratacaoId, mudou }
}

// ─── Sync principal ───────────────────────────────────────────────────────── //

export async function syncPncp(opts: SyncOpts): Promise<SyncResult> {
  const { db, verbose = false, maxPags } = opts
  const inicio = Date.now()
  const result: SyncResult = { inseridos: 0, atualizados: 0, iguais: 0, erros: 0, paginas: 0, duracaoMs: 0 }

  const log = (...args: unknown[]) => verbose && console.log(...args)

  // 1. Carrega fonte
  const [fonte] = await db.select().from(fontes).where(eq(fontes.slug, "pncp"))
  if (!fonte) throw new Error("Fonte 'pncp' não encontrada. Rode db:seed primeiro.")

  // 2. Cria registro de execução
  const [exec] = await db
    .insert(syncExecucoes)
    .values({ fonteId: fonte.id, status: "executando" })
    .returning({ id: syncExecucoes.id })
  const execId = exec.id

  const dataFinal = dataFuturo(JANELA_DIAS)
  log(`\n▶ Sync PNCP — propostas com encerramento até ${dataFinal}`)

  try {
    let pagina = 1
    let totalPaginas = 1

    do {
      const url = `${BASE_URL}/v1/contratacoes/proposta?dataFinal=${dataFinal}&pagina=${pagina}&tamanhoPagina=${PAGE_SIZE}`
      log(`  Pág ${pagina}/${totalPaginas}…`)

      let paginado: PncpPaginado
      try {
        paginado = await fetchComRetry(url)
      } catch (err) {
        await db.insert(syncErros).values({
          fonteId:    fonte.id,
          execucaoId: execId,
          endpoint:   url,
          mensagem:   (err as Error).message,
        })
        result.erros++
        break
      }

      totalPaginas = paginado.totalPaginas
      result.paginas++

      for (const item of paginado.data ?? []) {
        try {
          const orgaoId    = await upsertOrgao(db, item)
          const unidadeId  = await upsertUnidade(db, orgaoId, item)
          const { mudou }  = await upsertContratacao(db, fonte.id, item, orgaoId, unidadeId)
          if (mudou) result.inseridos++; else result.iguais++
        } catch (err) {
          result.erros++
          await db.insert(syncErros).values({
            fonteId:    fonte.id,
            execucaoId: execId,
            endpoint:   url,
            mensagem:   `item ${item.numeroControlePNCP}: ${(err as Error).message}`,
          })
        }
      }

      // Atualiza progresso
      await db
        .update(syncExecucoes)
        .set({
          registrosLidos:    pagina * PAGE_SIZE,
          registrosGravados: result.inseridos,
          erros:             result.erros,
        })
        .where(eq(syncExecucoes.id, execId))

      pagina++
      if (maxPags && pagina > maxPags) { log("  (limite de páginas atingido)"); break }
      if (pagina <= totalPaginas) await new Promise(res => setTimeout(res, DELAY_MS))
    } while (pagina <= totalPaginas)

    // Atualiza cursor
    await db
      .insert(syncCursores)
      .values({ fonteId: fonte.id, chave: "ultima_execucao", valor: { ts: new Date().toISOString(), paginas: result.paginas } })
      .onConflictDoUpdate({
        target: [syncCursores.fonteId, syncCursores.chave],
        set: { valor: sql`excluded.valor`, atualizadoEm: sql`now()` },
      })

    result.duracaoMs = Date.now() - inicio

    await db
      .update(syncExecucoes)
      .set({
        status:           "concluido",
        concluidoEm:      new Date(),
        registrosLidos:   result.paginas * PAGE_SIZE,
        registrosGravados: result.inseridos,
        erros:            result.erros,
        detalhes:         result as unknown as Record<string, unknown>,
      })
      .where(eq(syncExecucoes.id, execId))

    log(`\n✅ Concluído: ${result.inseridos} inseridos/atualizados, ${result.iguais} iguais, ${result.erros} erros, ${result.paginas} páginas, ${(result.duracaoMs / 1000).toFixed(1)}s`)
  } catch (err) {
    result.duracaoMs = Date.now() - inicio
    await db
      .update(syncExecucoes)
      .set({ status: "falha", concluidoEm: new Date(), erros: result.erros })
      .where(eq(syncExecucoes.id, execId))
    throw err
  }

  return result
}
