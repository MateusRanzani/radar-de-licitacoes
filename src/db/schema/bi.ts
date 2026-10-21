import {
  pgTable, bigserial, bigint, smallint, integer, text, boolean, date, numeric, timestamp,
  index,
} from "drizzle-orm/pg-core"
import { contratacoes } from "./public"

// ─── Tabela de fatos para BI ─────────────────────────────────────────────── //
// Armazena apenas códigos e valores (sem texto descritivo) para manter tamanho mínimo.
// ~120-170 MB/ano. Particionamento por `ano` adicionado via SQL custom na migração.
// Histórico desde 2024-01-01, backfill via GitHub Actions.

export const biFatos = pgTable("bi_fatos", {
  id:                       bigserial("id", { mode: "bigint" }).primaryKey(),
  ano:                      smallint("ano").notNull(),
  dataPublicacao:           date("data_publicacao").notNull(),
  uf:                       text("uf"),
  municipioIbge:            text("municipio_ibge"),
  modalidadeId:             integer("modalidade_id"),
  esfera:                   text("esfera"),         // F|E|M|D
  categoriaId:              integer("categoria_id"),
  tipoObjeto:               text("tipo_objeto"),    // M=material, S=serviço, O=obra
  orgaoId:                  integer("orgao_id"),
  // Valores em centavos (bigint) para agregar sem ponto flutuante
  valorEstimadoCentavos:    bigint("valor_estimado_centavos",    { mode: "bigint" }),
  valorHomologadoCentavos:  bigint("valor_homologado_centavos",  { mode: "bigint" }),
  sigiloso:                 boolean("sigiloso").default(false),
  meEpp:                    boolean("me_epp").default(false),
  cnpjOrgao:                text("cnpj_orgao"),
  anoCompra:                smallint("ano_compra"),
  sequencialCompra:         integer("sequencial_compra"),
  contratacaoId:            bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id, { onDelete: "set null" }),
}, (t) => [
  index("bi_fatos_ano_idx").on(t.ano),
  index("bi_fatos_data_idx").on(t.dataPublicacao),
  index("bi_fatos_uf_idx").on(t.uf),
  index("bi_fatos_modalidade_idx").on(t.modalidadeId),
  index("bi_fatos_esfera_idx").on(t.esfera),
  index("bi_fatos_orgao_idx").on(t.orgaoId),
])
