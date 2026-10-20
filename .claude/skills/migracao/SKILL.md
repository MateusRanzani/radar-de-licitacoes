---
name: migracao
description: Cria e aplica uma migração de banco no LicitaRadar (Drizzle + Postgres local/Neon), com estimativa de espaço e testes. Use para qualquer mudança de esquema (tabela, coluna, índice, função, partição, visão materializada).
---

# Migração (Drizzle)

Argumento: descrição curta da mudança. Para mudanças grandes, delegue ao agente `db-architect`.

1. Postgres local de pé: `docker compose up -d db`.
2. Edite `src/db/schema/*.ts`. Para SQL fora do Drizzle (extensões, tsvector, GIN/trigram, partições, visões materializadas): `npx drizzle-kit generate --custom --name=<nome>` e escreva o SQL.
3. Checklist:
   - [ ] dinheiro `numeric(18,4)` ou `bigint` centavos (BI); datas `timestamptz`; nomes em português sem acento
   - [ ] índices para os filtros/ordenações reais
   - [ ] estimativa de espaço (bytes/linha × linhas) se for tabela grande — limite total 1 GB no Neon free
   - [ ] nada destrutivo sem plano de dados
4. `npm run db:generate` (se mudou schema TS) → `npm run db:reset` → `npm run typecheck` → `npm test -- db`.
5. Reporte: arquivo da migração, o que mudou, impacto de espaço, testes.

Nunca aplique migração no Neon (produção) sem confirmação explícita do usuário.
