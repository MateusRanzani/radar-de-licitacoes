CREATE SCHEMA "auth_app";
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"regras" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contratacoes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"numero_controle_pncp" text,
	"numero" text,
	"processo" text,
	"objeto" text,
	"informacao_complementar" text,
	"orgao_id" integer,
	"unidade_orgao_id" integer,
	"modalidade_id" integer,
	"modo_disputa" text,
	"instrumento" text,
	"amparo_legal" text,
	"srp" boolean DEFAULT false,
	"esfera" text,
	"valor_estimado" numeric(18, 4),
	"valor_homologado" numeric(18, 4),
	"orcamento_sigiloso" boolean DEFAULT false,
	"situacao_id" integer,
	"situacao_nome" text,
	"status_derivado" text DEFAULT 'indeterminada',
	"data_publicacao_pncp" timestamp with time zone,
	"data_abertura_proposta" timestamp with time zone,
	"data_encerramento_proposta" timestamp with time zone,
	"data_inclusao" timestamp with time zone,
	"data_atualizacao_fonte" timestamp with time zone,
	"coletado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"hash_conteudo" text,
	CONSTRAINT "contratacoes_numero_controle_pncp_unique" UNIQUE("numero_controle_pncp")
);
--> statement-breakpoint
CREATE TABLE "documentos_contratacao" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contratacao_id" bigint NOT NULL,
	"sequencial" integer NOT NULL,
	"titulo" text,
	"tipo" text,
	"url" text NOT NULL,
	"data_publicacao" timestamp with time zone,
	"status_ativo" boolean DEFAULT true,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fontes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"status" text DEFAULT 'planejada' NOT NULL,
	"descricao" text,
	"docs_url" text,
	"cobertura" text,
	"frequencia_sync" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fontes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "historico_contratacao" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contratacao_id" bigint NOT NULL,
	"tipo" text NOT NULL,
	"descricao" text,
	"dados_anteriores" jsonb,
	"dados_novos" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_contratacao" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contratacao_id" bigint NOT NULL,
	"numero_item" integer NOT NULL,
	"descricao" text,
	"material_ou_servico" text,
	"quantidade" numeric(18, 4),
	"unidade_medida" text,
	"valor_unitario_estimado" numeric(18, 4),
	"valor_total" numeric(18, 4),
	"situacao_nome" text,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "localidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_ibge" text NOT NULL,
	"municipio" text NOT NULL,
	"uf" text NOT NULL,
	"regiao" text,
	CONSTRAINT "localidades_codigo_ibge_unique" UNIQUE("codigo_ibge")
);
--> statement-breakpoint
CREATE TABLE "modalidades" (
	"id" integer PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"status_ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orgaos" (
	"id" serial PRIMARY KEY NOT NULL,
	"cnpj" text NOT NULL,
	"razao_social" text NOT NULL,
	"esfera" text,
	"poder_id" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orgaos_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "registros_fonte" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fonte_id" integer NOT NULL,
	"id_externo" text NOT NULL,
	"contratacao_id" bigint,
	"url_origem" text,
	"payload_bruto" jsonb,
	"coletado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_na_fonte_em" timestamp with time zone,
	"hash_conteudo" text
);
--> statement-breakpoint
CREATE TABLE "sync_cursores" (
	"fonte_id" integer NOT NULL,
	"chave" text NOT NULL,
	"valor" jsonb NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_cursores_fonte_id_chave_pk" PRIMARY KEY("fonte_id","chave")
);
--> statement-breakpoint
CREATE TABLE "sync_erros" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fonte_id" integer,
	"execucao_id" bigint,
	"endpoint" text,
	"status_http" integer,
	"mensagem" text NOT NULL,
	"corpo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_execucoes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fonte_id" integer NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"concluido_em" timestamp with time zone,
	"status" text DEFAULT 'executando' NOT NULL,
	"registros_lidos" integer DEFAULT 0,
	"registros_gravados" integer DEFAULT 0,
	"erros" integer DEFAULT 0,
	"cursor_final" jsonb,
	"detalhes" jsonb
);
--> statement-breakpoint
CREATE TABLE "unidades_orgao" (
	"id" serial PRIMARY KEY NOT NULL,
	"orgao_id" integer NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"uf_sigla" text,
	"municipio_nome" text,
	"codigo_ibge" text
);
--> statement-breakpoint
CREATE TABLE "auth_app"."contas" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" text,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "auth_app"."tokens_verificacao" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "tokens_verificacao_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_app"."usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verificado" timestamp with time zone,
	"nome" text,
	"imagem" text,
	"senha_hash" text,
	"papel" text DEFAULT 'usuario' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "alertas_enviados" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"evento_id" text NOT NULL,
	"tipo" text NOT NULL,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anotacoes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contratacao_id" bigint NOT NULL,
	"conteudo" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favoritos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contratacao_id" bigint NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pesquisas_salvas" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nome" text NOT NULL,
	"filtros" jsonb NOT NULL,
	"frequencia" text DEFAULT 'diaria',
	"ativa" boolean DEFAULT true,
	"ultima_execucao" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferencias_notificacao" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email_alertas" boolean DEFAULT true,
	"frequencia_alertas" text DEFAULT 'diaria',
	"prazo_aviso_dias" integer DEFAULT 3,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_pessoal" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contratacao_id" bigint NOT NULL,
	"status" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bi_fatos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ano" smallint NOT NULL,
	"data_publicacao" date NOT NULL,
	"uf" text,
	"municipio_ibge" text,
	"modalidade_id" integer,
	"esfera" text,
	"categoria_id" integer,
	"tipo_objeto" text,
	"orgao_id" integer,
	"valor_estimado_centavos" bigint,
	"valor_homologado_centavos" bigint,
	"sigiloso" boolean DEFAULT false,
	"me_epp" boolean DEFAULT false,
	"cnpj_orgao" text,
	"ano_compra" smallint,
	"sequencial_compra" integer,
	"contratacao_id" bigint
);
--> statement-breakpoint
ALTER TABLE "contratacoes" ADD CONSTRAINT "contratacoes_orgao_id_orgaos_id_fk" FOREIGN KEY ("orgao_id") REFERENCES "public"."orgaos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratacoes" ADD CONSTRAINT "contratacoes_unidade_orgao_id_unidades_orgao_id_fk" FOREIGN KEY ("unidade_orgao_id") REFERENCES "public"."unidades_orgao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratacoes" ADD CONSTRAINT "contratacoes_modalidade_id_modalidades_id_fk" FOREIGN KEY ("modalidade_id") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_contratacao" ADD CONSTRAINT "documentos_contratacao_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_contratacao" ADD CONSTRAINT "historico_contratacao_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_contratacao" ADD CONSTRAINT "itens_contratacao_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_fonte" ADD CONSTRAINT "registros_fonte_fonte_id_fontes_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fontes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_fonte" ADD CONSTRAINT "registros_fonte_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_cursores" ADD CONSTRAINT "sync_cursores_fonte_id_fontes_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fontes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_erros" ADD CONSTRAINT "sync_erros_fonte_id_fontes_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fontes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_erros" ADD CONSTRAINT "sync_erros_execucao_id_sync_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."sync_execucoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_execucoes" ADD CONSTRAINT "sync_execucoes_fonte_id_fontes_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fontes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades_orgao" ADD CONSTRAINT "unidades_orgao_orgao_id_orgaos_id_fk" FOREIGN KEY ("orgao_id") REFERENCES "public"."orgaos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_app"."contas" ADD CONSTRAINT "contas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth_app"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_pessoal" ADD CONSTRAINT "status_pessoal_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_fatos" ADD CONSTRAINT "bi_fatos_contratacao_id_contratacoes_id_fk" FOREIGN KEY ("contratacao_id") REFERENCES "public"."contratacoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contratacoes_orgao_idx" ON "contratacoes" USING btree ("orgao_id");--> statement-breakpoint
CREATE INDEX "contratacoes_modalidade_idx" ON "contratacoes" USING btree ("modalidade_id");--> statement-breakpoint
CREATE INDEX "contratacoes_encerramento_idx" ON "contratacoes" USING btree ("data_encerramento_proposta");--> statement-breakpoint
CREATE INDEX "contratacoes_publicacao_idx" ON "contratacoes" USING btree ("data_publicacao_pncp");--> statement-breakpoint
CREATE INDEX "contratacoes_status_idx" ON "contratacoes" USING btree ("status_derivado");--> statement-breakpoint
CREATE INDEX "documentos_contratacao_idx" ON "documentos_contratacao" USING btree ("contratacao_id");--> statement-breakpoint
CREATE INDEX "historico_contratacao_idx" ON "historico_contratacao" USING btree ("contratacao_id");--> statement-breakpoint
CREATE INDEX "historico_criado_em_idx" ON "historico_contratacao" USING btree ("criado_em");--> statement-breakpoint
CREATE INDEX "itens_contratacao_idx" ON "itens_contratacao" USING btree ("contratacao_id");--> statement-breakpoint
CREATE INDEX "localidades_uf_idx" ON "localidades" USING btree ("uf");--> statement-breakpoint
CREATE UNIQUE INDEX "registros_fonte_unique_idx" ON "registros_fonte" USING btree ("fonte_id","id_externo");--> statement-breakpoint
CREATE INDEX "registros_fonte_contratacao_idx" ON "registros_fonte" USING btree ("contratacao_id");--> statement-breakpoint
CREATE INDEX "sync_erros_fonte_idx" ON "sync_erros" USING btree ("fonte_id");--> statement-breakpoint
CREATE INDEX "sync_erros_criado_idx" ON "sync_erros" USING btree ("criado_em");--> statement-breakpoint
CREATE INDEX "sync_execucoes_fonte_idx" ON "sync_execucoes" USING btree ("fonte_id");--> statement-breakpoint
CREATE INDEX "sync_execucoes_iniciado_idx" ON "sync_execucoes" USING btree ("iniciado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "unidades_orgao_orgao_codigo_idx" ON "unidades_orgao" USING btree ("orgao_id","codigo");--> statement-breakpoint
CREATE UNIQUE INDEX "alertas_user_evento_idx" ON "alertas_enviados" USING btree ("user_id","evento_id");--> statement-breakpoint
CREATE INDEX "anotacoes_user_idx" ON "anotacoes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "anotacoes_contratacao_idx" ON "anotacoes" USING btree ("contratacao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favoritos_user_contratacao_idx" ON "favoritos" USING btree ("user_id","contratacao_id");--> statement-breakpoint
CREATE INDEX "favoritos_user_idx" ON "favoritos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pesquisas_salvas_user_idx" ON "pesquisas_salvas" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "status_pessoal_user_contratacao_idx" ON "status_pessoal" USING btree ("user_id","contratacao_id");--> statement-breakpoint
CREATE INDEX "bi_fatos_ano_idx" ON "bi_fatos" USING btree ("ano");--> statement-breakpoint
CREATE INDEX "bi_fatos_data_idx" ON "bi_fatos" USING btree ("data_publicacao");--> statement-breakpoint
CREATE INDEX "bi_fatos_uf_idx" ON "bi_fatos" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "bi_fatos_modalidade_idx" ON "bi_fatos" USING btree ("modalidade_id");--> statement-breakpoint
CREATE INDEX "bi_fatos_esfera_idx" ON "bi_fatos" USING btree ("esfera");--> statement-breakpoint
CREATE INDEX "bi_fatos_orgao_idx" ON "bi_fatos" USING btree ("orgao_id");--> statement-breakpoint
-- ─── Full-Text Search (FTS) ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- Wrapper imutável para unaccent (necessário para GENERATED STORED column)
CREATE OR REPLACE FUNCTION unaccent_imut(text)
  RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
$$ SELECT unaccent($1) $$;
--> statement-breakpoint
-- Coluna tsvector gerada automaticamente pelo banco
ALTER TABLE "contratacoes"
  ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'portuguese',
      unaccent_imut(coalesce("objeto", '')) || ' ' ||
      unaccent_imut(coalesce("numero", '')) || ' ' ||
      unaccent_imut(coalesce("processo", ''))
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX "contratacoes_tsv_idx" ON "contratacoes" USING gin ("tsv");
