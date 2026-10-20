# LicitaRadar — Plano Técnico

> Visão geral: [PROJETO.md](PROJETO.md) · Design: [DESIGN.md](DESIGN.md) · Fontes: [fontes/](fontes/)
> **Etapa atual: 0 — em andamento** (2026-10-20)

## 1. Stack (gratuita no início)

| Camada | Escolha |
|---|---|
| App | Next.js 16 (App Router, RSC, Turbopack), TypeScript estrito |
| UI | Tailwind CSS v4 + componentes próprios/shadcn (Radix) + lucide; tokens de [DESIGN.md](DESIGN.md) |
| Banco | **Neon Postgres** (free: 1 GB/projeto, scale-to-zero) · local: Postgres 17 em Docker |
| Acesso a dados | **Drizzle ORM** + migrações `drizzle-kit` em `drizzle/`; só no servidor (`server-only`) |
| Busca | Postgres FTS (`portuguese` + `unaccent`) + `pg_trgm` |
| Auth | NextAuth/Auth.js v5, sessão JWT: e-mail+senha (argon2id) + link mágico (Resend) |
| E-mail | Resend (free) |
| Agendamento | GitHub Actions (cron) e/ou cron-job.org chamando rotas protegidas `/api/cron/*` em fatias ≤ 5 min (Vercel Hobby só permite cron diário) |
| Hospedagem | Vercel Hobby (uso não comercial — migrar ao comercializar) |
| Testes | Vitest, Playwright |

## 2. Estrutura

```
src/
  app/                    # rotas (RSC)
  components/             # ui/ (primitivos), layout/ (shell), licitacoes/ (cards, filtros)
  modules/
    connectors/core|pncp|comprasgov|bll
    sync/  search/  classification/  monitoring/  bi/  notifications/
  db/                     # schema Drizzle, cliente (server-only)
  lib/                    # formatação pt-BR, datas, utilitários
  auth.ts
drizzle/                  # migrações SQL geradas
docs/
```

## 3. Modelo de dados

**Fontes em duas camadas** (ver PROJETO.md §4):
- `registros_fonte` — 1 linha por (fonte, id_externo), normalizado, com `url_origem`, `coletado_em`, `atualizado_na_fonte_em`, `hash_conteudo`. Nunca mesclado nem apagado por deduplicação.
- `contratacoes` — 1 linha por contratação real (chave natural `numero_controle_pncp` quando existir); campos consolidados com origem por campo (`origem_campos jsonb`); `status_derivado` (`aberta_confirmada|encerrada|indeterminada`); `tsv` para busca. Retenção: abertas + encerradas há ≤ 60 dias + favoritadas/acompanhadas.
- `registros_fonte.contratacao_id` + `motivo_vinculo` + `confianca_vinculo`.
- Apoio: `fontes`, `orgaos`, `unidades_orgao`, `localidades` (IBGE), `modalidades`, `categorias` (árvore) + `contratacao_categorias` (confiança, origem regra|codigo|manual|ia), `itens_contratacao`/`documentos_contratacao` (sob demanda, cache), `historico_contratacao`, `sync_execucoes`, `sync_cursores`, `sync_erros`.

**BI enxuto** (histórico desde 2024-01-01):
- `bi_fatos` particionada por ano: 1 linha por contratação, só códigos/números — `data_publicacao date`, `uf/modalidade/esfera/situacao/tipo_objeto/categoria smallint`, `municipio_ibge int`, `orgao_id int`, `valor_estimado_centavos/valor_homologado_centavos bigint`, `sigiloso/me_epp boolean`, chave PNCP (`cnpj bigint, ano smallint, sequencial int`). Estimativa a medir: ~120–170 MB/ano.
- Visões materializadas por mês × UF × modalidade × esfera × categoria × tipo; rankings mensais de órgãos/municípios. Atualizadas por job diário (meses recentes recalculados).
- Quando o espaço apertar: anos antigos viram só agregados mensais.

**Usuário** (`auth_app.usuarios`, `contas`, `tokens_verificacao`; `favoritos`, `anotacoes`, `status_pessoal`, `pesquisas_salvas`, `alertas_enviados` UNIQUE(user_id, evento_id), `preferencias_notificacao`): acesso só via servidor, sempre filtrado pelo `userId` da sessão.

Dinheiro: `numeric(18,4)` nas tabelas operacionais, `bigint` centavos no BI. Datas `timestamptz` (PNCP sem fuso → `America/Sao_Paulo`).

## 4. Etapas — do mais simples ao mais complexo

Cada etapa termina com o app rodando, typecheck/lint/testes verdes e relatório (`/fechar-fase`).

| # | Etapa | Entregas | Pronto quando |
|---|---|---|---|
| **0** | **Cara do sistema (hoje)** | Next.js + Tailwind + tokens do DESIGN.md; shell (topo em pílulas, coluna de ícones, vidro); home com busca em destaque; **lista de licitações com proposta aberta lida ao vivo da API do PNCP** (filtros UF e modalidade, paginação); página de detalhe ao vivo (dados, itens, arquivos); estados de carregamento/erro/vazio; páginas futuras com aviso "em construção" (sem números falsos) | `npm run dev` mostra dados reais do PNCP com link para a origem |
| 1 | Banco | Postgres local (Docker) + Neon; Drizzle; migrações do modelo operacional; seed (fontes, modalidades, UFs/municípios IBGE, categorias) | `npm run db:reset` reproduz o banco |
| 2 | Sync PNCP | conector com retry/backoff; sync fatiado (`/proposta`, `/publicacao`, `/atualizacao`); upsert idempotente; histórico de diff; retenção; admin de conectores; rota cron | rodar 2× não duplica; erros em `sync_erros`; tamanho real das tabelas medido |
| 3 | Busca | páginas passam a ler do banco; FTS com frase/inclusão/exclusão; filtros completos; ordenação; chips; lista/compacta; classificação por regras + confiança | busca sem acento/caixa coerente; e2e busca→detalhe→origem |
| 4 | Login | NextAuth (JWT, e-mail+senha, link mágico Resend); páginas protegidas; papel admin | cadastro/login/sair; admin protegido no servidor |
| 5 | Acompanhamento | favoritos, notas, status pessoal, pesquisas salvas | usuário A não vê dados de B (teste) |
| 6 | BI | `bi_fatos` + visões; backfill desde 2024-01 (GitHub Actions, retomável); painel BI (tempo, valores, UF/mapa, modalidade, esfera, categoria, rankings, filtros cruzados) | números batem com contagens do banco; avisos de cobertura |
| 7 | Alertas | detecção de novos/alterados; e-mail Resend com dedup e frequência; prazos próximos | alerta não repete para o mesmo evento |
| 8 | Outras fontes | Compras.gov.br, BLL (investigação + conectores), vínculo entre fontes | `docs/fontes/*.md`; nada não-funcional exposto |
| 9 | IA | embeddings, extração de documentos, resumos e perguntas com citação | toda resposta com referência |

Enquanto a etapa 2 não existir, o filtro "portal" mostra o sistema de disputa informado pelo próprio PNCP (`linkSistemaOrigem`/`usuarioNome`), rotulado como "publicado no PNCP".

## 5. Regras de integridade

- Nada inventado; ausente = "Não informado"; orçamento sigiloso = "Sigiloso".
- "Aberta" só com confirmação (etapa 0: proposta com encerramento futuro segundo o PNCP no momento da consulta, com horário da consulta exibido).
- Toda contratação mostra fonte, link original e data da coleta/consulta.
- Contagens sempre exatas (`totalRegistros` da API ou `count(*)`).
- BI informa cobertura/período; dados anteriores a 2024 não são usados por padrão.

## 6. Otimização web

Server Components + streaming; filtros na URL; `fetch` à API PNCP com `revalidate` curto no servidor; Client Components só em ilhas; `next/font`; vidro restrito (DESIGN.md §3); gráficos leves carregados sob demanda no BI.

## 7. Agentes e skills

Agentes: `connector-engineer`, `db-architect`, `nextjs-ui-engineer`, `qa-verifier`, `data-integrity-reviewer`.
Skills: `/nova-fonte`, `/migracao`, `/fechar-fase`, `/sync-local`, `/pncp-api`.
