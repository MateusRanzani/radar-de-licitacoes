import {
  pgTable, bigserial, bigint, integer, text, boolean, timestamp, jsonb,
  uniqueIndex, index, primaryKey,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { usuarios } from "./auth"
import { contratacoes } from "./public"

// ─── Favoritos ────────────────────────────────────────────────────────────── //

export const favoritos = pgTable("favoritos", {
  id:            bigserial("id", { mode: "bigint" }).primaryKey(),
  userId:        text("user_id").notNull(),
  contratacaoId: bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id, { onDelete: "cascade" }).notNull(),
  criadoEm:      timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("favoritos_user_contratacao_idx").on(t.userId, t.contratacaoId),
  index("favoritos_user_idx").on(t.userId),
])

// ─── Anotações ────────────────────────────────────────────────────────────── //

export const anotacoes = pgTable("anotacoes", {
  id:            bigserial("id", { mode: "bigint" }).primaryKey(),
  userId:        text("user_id").notNull(),
  contratacaoId: bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id, { onDelete: "cascade" }).notNull(),
  conteudo:      text("conteudo").notNull(),
  criadoEm:     timestamp("criado_em",    { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("anotacoes_user_idx").on(t.userId),
  index("anotacoes_contratacao_idx").on(t.contratacaoId),
])

// ─── Status pessoal (pipeline individual) ────────────────────────────────── //

export const statusPessoal = pgTable("status_pessoal", {
  id:            bigserial("id", { mode: "bigint" }).primaryKey(),
  userId:        text("user_id").notNull(),
  contratacaoId: bigint("contratacao_id", { mode: "bigint" }).references(() => contratacoes.id, { onDelete: "cascade" }).notNull(),
  // nova|analisar|interessante|participar|descartada
  status:        text("status").notNull(),
  criadoEm:     timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("status_pessoal_user_contratacao_idx").on(t.userId, t.contratacaoId),
])

// ─── Pesquisas salvas ─────────────────────────────────────────────────────── //

export const pesquisasSalvas = pgTable("pesquisas_salvas", {
  id:             bigserial("id", { mode: "bigint" }).primaryKey(),
  userId:         text("user_id").notNull(),
  nome:           text("nome").notNull(),
  filtros:        jsonb("filtros").notNull(),
  frequencia:     text("frequencia").default("diaria"),
  ativa:          boolean("ativa").default(true),
  ultimaExecucao: timestamp("ultima_execucao", { withTimezone: true }),
  criadoEm:      timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("pesquisas_salvas_user_idx").on(t.userId),
])

// ─── Alertas enviados (dedup) ────────────────────────────────────────────── //

export const alertasEnviados = pgTable("alertas_enviados", {
  id:        bigserial("id", { mode: "bigint" }).primaryKey(),
  userId:    text("user_id").notNull(),
  eventoId:  text("evento_id").notNull(), // "<tipo>:<contratacao_id>:<data>" — garante idempotência
  tipo:      text("tipo").notNull(),
  enviadoEm: timestamp("enviado_em", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("alertas_user_evento_idx").on(t.userId, t.eventoId),
])

// ─── Preferências de notificação ─────────────────────────────────────────── //

export const preferenciasNotificacao = pgTable("preferencias_notificacao", {
  userId:          text("user_id").primaryKey(),
  emailAlertas:    boolean("email_alertas").default(true),
  frequenciaAlertas: text("frequencia_alertas").default("diaria"),
  prazoAvisoDias:  integer("prazo_aviso_dias").default(3),
  atualizadoEm:   timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
})
