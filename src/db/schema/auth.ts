import { pgSchema, text, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const authSchema = pgSchema("auth_app")

// ─── Usuários ─────────────────────────────────────────────────────────────── //

export const usuarios = authSchema.table("usuarios", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:          text("email").unique().notNull(),
  emailVerificado: timestamp("email_verificado", { withTimezone: true }),
  nome:           text("nome"),
  imagem:         text("imagem"),
  senhaHash:      text("senha_hash"),   // argon2id, null para magic-link only
  papel:          text("papel").default("usuario").notNull(), // usuario|admin
  criadoEm:       timestamp("criado_em",    { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm:   timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
})

// ─── Contas OAuth (futuro) ────────────────────────────────────────────────── //

export const contas = authSchema.table("contas", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  usuarioId:        text("usuario_id").references(() => usuarios.id, { onDelete: "cascade" }).notNull(),
  type:             text("type").notNull(),
  provider:         text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken:     text("refresh_token"),
  accessToken:      text("access_token"),
  expiresAt:        text("expires_at"),
  tokenType:        text("token_type"),
  scope:            text("scope"),
  idToken:          text("id_token"),
  sessionState:     text("session_state"),
})

// ─── Tokens de verificação / magic-link ──────────────────────────────────── //

export const tokensVerificacao = authSchema.table("tokens_verificacao", {
  identifier: text("identifier").notNull(),
  token:      text("token").unique().notNull(),
  expires:    timestamp("expires", { withTimezone: true }).notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────── //

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  contas: many(contas),
}))

export const contasRelations = relations(contas, ({ one }) => ({
  usuario: one(usuarios, { fields: [contas.usuarioId], references: [usuarios.id] }),
}))
