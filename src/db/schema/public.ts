import {
  pgTable, serial, integer, bigserial, bigint,
  text, boolean, numeric, jsonb, timestamp,
  uniqueIndex, index, primaryKey,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── Fontes de dados ──────────────────────────────────────────────────────── //

export const fontes = pgTable("fontes", {
  id:              serial("id").primaryKey(),
  slug:            text("slug").unique().notNull(),
  nome:            text("nome").notNull(),
  status:          text("status").default("planejada").notNull(), // ativa|parcial|indisponivel|planejada
  descricao:       text("descricao"),
  docsUrl:         text("docs_url"),
  cobertura:       text("cobertura"),
  frequenciaSync:  text("frequencia_sync"),
  criadoEm:        timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm:    timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
})

// ─── Modalidades (seed do PNCP) ───────────────────────────────────────────── //

export const modalidades = pgTable("modalidades", {
  id:          integer("id").primaryKey(), // id original do PNCP
  nome:        text("nome").notNull(),
  descricao:   text("descricao"),
  statusAtivo: boolean("status_ativo").default(true).notNull(),
})

// ─── Órgãos contratantes ─────────────────────────────────────────────────── //

export const orgaos = pgTable("orgaos", {
  id:          serial("id").primaryKey(),
  cnpj:        text("cnpj").unique().notNull(),
  razaoSocial: text("razao_social").notNull(),
  esfera:      text("esfera"),          // F|E|M|D
  poderId:     text("poder_id"),
  criadoEm:    timestamp("criado_em",    { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
})

// ─── Unidades organizacionais ─────────────────────────────────────────────── //

export const unidadesOrgao = pgTable("unidades_orgao", {
  id:           serial("id").primaryKey(),
  orgaoId:      integer("orgao_id").references(() => orgaos.id).notNull(),
  codigo:       text("codigo").notNull(),
  nome:         text("nome").notNull(),
  ufSigla:      text("uf_sigla"),
  municipioNome: text("municipio_nome"),
  codigoIbge:   text("codigo_ibge"),
}, (t) => [
  uniqueIndex("unidades_orgao_orgao_codigo_idx").on(t.orgaoId, t.codigo),
])

// ─── Localidades (seed IBGE) ─────────────────────────────────────────────── //

export const localidades = pgTable("localidades", {
  id:           serial("id").primaryKey(),
  codigoIbge:   text("codigo_ibge").unique().notNull(),
  municipio:    text("municipio").notNull(),
  uf:           text("uf").notNull(),
  regiao:       text("regiao"),
}, (t) => [
  index("localidades_uf_idx").on(t.uf),
])

// ─── Categorias (árvore) ─────────────────────────────────────────────────── //

export const categorias = pgTable("categorias", {
  id:        serial("id").primaryKey(),
  parentId:  integer("parent_id"),
  slug:      text("slug").unique().notNull(),
  nome:      text("nome").notNull(),
  descricao: text("descricao"),
  regras:    jsonb("regras"),
  criadoEm:  timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
})

// ─── Contratações unificadas ─────────────────────────────────────────────── //

export const contratacoes = pgTable("contratacoes", {
  id:                      bigserial("id", { mode: "bigint" }).primaryKey(),
  // Proveniência
  numeroControlePncp:      text("numero_controle_pncp").unique(), // null para fontes sem PNCP
  // Dados principais
  numero:                  text("numero"),
  processo:                text("processo"),
  objeto:                  text("objeto"),
  informacaoComplementar:  text("informacao_complementar"),
  // Relacionamentos
  orgaoId:                 integer("orgao_id").references(() => orgaos.id),
  unidadeOrgaoId:          integer("unidade_orgao_id").references(() => unidadesOrgao.id),
  modalidadeId:            integer("modalidade_id").references(() => modalidades.id),
  // Detalhes
  modoDisputa:             text("modo_disputa"),
  instrumento:             text("instrumento"),
  amparoLegal:             text("amparo_legal"),
  srp:                     boolean("srp").default(false),
  esfera:                  text("esfera"),
  // Valores
  valorEstimado:           numeric("valor_estimado", { precision: 18, scale: 4 }),
  valorHomologado:         numeric("valor_homologado", { precision: 18, scale: 4 }),
  orcamentoSigiloso:       boolean("orcamento_sigiloso").default(false),
  // Status
  situacaoId:              integer("situacao_id"),
  situacaoNome:            text("situacao_nome"),
  statusDerivado:          text("status_derivado").default("indeterminada"),
  // Datas
  dataPublicacaoPncp:      timestamp("data_publicacao_pncp",       { withTimezone: true }),
  dataAberturaProposta:    timestamp("data_abertura_proposta",     { withTimezone: true }),
  dataEncerramentoProposta: timestamp("data_encerramento_proposta", { withTimezone: true }),
  dataInclusao:            timestamp("data_inclusao",              { withTimezone: true }),
  dataAtualizacaoFonte:    timestamp("data_atualizacao_fonte",     { withTimezone: true }),
  // Sync
  coletadoEm:              timestamp("coletado_em", { withTimezone: true }).defaultNow().notNull(),
  hashConteudo:            text("hash_conteudo"),
}, (t) => [
  index("contratacoes_orgao_idx").on(t.orgaoId),
  index("contratacoes_modalidade_idx").on(t.modalidadeId),
  index("contratacoes_encerramento_idx").on(t.dataEncerramentoProposta),
  index("contratacoes_publicacao_idx").on(t.dataPublicacaoPncp),
  index("contratacoes_status_idx").on(t.statusDerivado),
])

// ─── Registros por fonte (raw) ────────────────────────────────────────────── //

export const registrosFonte = pgTable("registros_fonte", {
  id:                   bigserial("id", { mode: "bigint" }).primaryKey(),
  fonteId:              integer("fonte_id").references(() => fontes.id).notNull(),
  idExterno:            text("id_externo").notNull(),
  contratacaoId:        bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id),
  urlOrigem:            text("url_origem"),
  payloadBruto:         jsonb("payload_bruto"),
  coletadoEm:           timestamp("coletado_em",            { withTimezone: true }).defaultNow().notNull(),
  atualizadoNaFonteEm:  timestamp("atualizado_na_fonte_em", { withTimezone: true }),
  hashConteudo:         text("hash_conteudo"),
}, (t) => [
  uniqueIndex("registros_fonte_unique_idx").on(t.fonteId, t.idExterno),
  index("registros_fonte_contratacao_idx").on(t.contratacaoId),
])

// ─── Itens (on-demand) ───────────────────────────────────────────────────── //

export const itensContratacao = pgTable("itens_contratacao", {
  id:                     bigserial("id", { mode: "bigint" }).primaryKey(),
  contratacaoId:          bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id).notNull(),
  numeroItem:             integer("numero_item").notNull(),
  descricao:              text("descricao"),
  materialOuServico:      text("material_ou_servico"),
  quantidade:             numeric("quantidade",              { precision: 18, scale: 4 }),
  unidadeMedida:          text("unidade_medida"),
  valorUnitarioEstimado:  numeric("valor_unitario_estimado", { precision: 18, scale: 4 }),
  valorTotal:             numeric("valor_total",             { precision: 18, scale: 4 }),
  situacaoNome:           text("situacao_nome"),
  criadoEm:              timestamp("criado_em", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("itens_contratacao_idx").on(t.contratacaoId),
])

// ─── Documentos (on-demand) ──────────────────────────────────────────────── //

export const documentosContratacao = pgTable("documentos_contratacao", {
  id:              bigserial("id", { mode: "bigint" }).primaryKey(),
  contratacaoId:   bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id).notNull(),
  sequencial:      integer("sequencial").notNull(),
  titulo:          text("titulo"),
  tipo:            text("tipo"),
  url:             text("url").notNull(),
  dataPublicacao:  timestamp("data_publicacao", { withTimezone: true }),
  statusAtivo:     boolean("status_ativo").default(true),
  criadoEm:        timestamp("criado_em", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("documentos_contratacao_idx").on(t.contratacaoId),
])

// ─── Histórico de alterações ─────────────────────────────────────────────── //

export const historicoContratacao = pgTable("historico_contratacao", {
  id:              bigserial("id", { mode: "bigint" }).primaryKey(),
  contratacaoId:   bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id).notNull(),
  tipo:            text("tipo").notNull(), // inclusao|atualizacao|diff
  descricao:       text("descricao"),
  dadosAnteriores: jsonb("dados_anteriores"),
  dadosNovos:      jsonb("dados_novos"),
  criadoEm:        timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("historico_contratacao_idx").on(t.contratacaoId),
  index("historico_criado_em_idx").on(t.criadoEm),
])

// ─── Sync execuções ───────────────────────────────────────────────────────── //

export const syncExecucoes = pgTable("sync_execucoes", {
  id:               bigserial("id", { mode: "bigint" }).primaryKey(),
  fonteId:          integer("fonte_id").references(() => fontes.id).notNull(),
  iniciadoEm:       timestamp("iniciado_em",  { withTimezone: true }).defaultNow().notNull(),
  concluidoEm:      timestamp("concluido_em", { withTimezone: true }),
  status:           text("status").default("executando").notNull(), // executando|concluido|falha
  registrosLidos:   integer("registros_lidos").default(0),
  registrosGravados: integer("registros_gravados").default(0),
  erros:            integer("erros").default(0),
  cursorFinal:      jsonb("cursor_final"),
  detalhes:         jsonb("detalhes"),
}, (t) => [
  index("sync_execucoes_fonte_idx").on(t.fonteId),
  index("sync_execucoes_iniciado_idx").on(t.iniciadoEm),
])

// ─── Sync cursores (resumable) ────────────────────────────────────────────── //

export const syncCursores = pgTable("sync_cursores", {
  fonteId:      integer("fonte_id").references(() => fontes.id).notNull(),
  chave:        text("chave").notNull(),
  valor:        jsonb("valor").notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.fonteId, t.chave] }),
])

// ─── Sync erros ───────────────────────────────────────────────────────────── //

export const syncErros = pgTable("sync_erros", {
  id:          bigserial("id", { mode: "bigint" }).primaryKey(),
  fonteId:     integer("fonte_id").references(() => fontes.id),
  execucaoId:  bigint("execucao_id", { mode: "bigint" }).references(() => syncExecucoes.id),
  endpoint:    text("endpoint"),
  statusHttp:  integer("status_http"),
  mensagem:    text("mensagem").notNull(),
  corpo:       text("corpo"),
  criadoEm:    timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("sync_erros_fonte_idx").on(t.fonteId),
  index("sync_erros_criado_idx").on(t.criadoEm),
])

// ─── Relations ────────────────────────────────────────────────────────────── //

export const fontesRelations = relations(fontes, ({ many }) => ({
  registros:   many(registrosFonte),
  execucoes:   many(syncExecucoes),
  cursores:    many(syncCursores),
  erros:       many(syncErros),
}))

export const orgaosRelations = relations(orgaos, ({ many }) => ({
  unidades:    many(unidadesOrgao),
  contratacoes: many(contratacoes),
}))

export const contratacoes_relations = relations(contratacoes, ({ one, many }) => ({
  orgao:         one(orgaos,        { fields: [contratacoes.orgaoId],        references: [orgaos.id] }),
  unidadeOrgao:  one(unidadesOrgao, { fields: [contratacoes.unidadeOrgaoId], references: [unidadesOrgao.id] }),
  modalidade:    one(modalidades,   { fields: [contratacoes.modalidadeId],   references: [modalidades.id] }),
  registros:     many(registrosFonte),
  itens:         many(itensContratacao),
  documentos:    many(documentosContratacao),
  historico:     many(historicoContratacao),
}))
