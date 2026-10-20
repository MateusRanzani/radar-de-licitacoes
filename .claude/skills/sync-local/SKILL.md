---
name: sync-local
description: Sobe o ambiente local do LicitaRadar (Postgres em Docker + Next.js) e executa uma sincronização real e curta de uma fonte, conferindo idempotência, erros e espaço. Use para popular o banco local, reproduzir bug de sync ou demonstrar o app com dados reais.
---

# Ambiente local + sync

1. Docker rodando? `docker info` (no Windows, abrir o Docker Desktop se falhar).
2. `docker compose up -d db` e confira `.env.local` (modelo em `.env.example`). Nunca imprima segredos na resposta.
3. `npm run db:reset` se o esquema mudou.
4. Sync curta (padrão: PNCP, 1 dia, 1 modalidade, poucas páginas):
   ```
   npm run sync -- --fonte=pncp --dias=1 --modalidade=6 --max-paginas=3
   ```
5. Verifique (`docker compose exec db psql -U postgres licitaradar`):
   ```sql
   select count(*) from registros_fonte;
   select count(*) from contratacoes;
   select status, registros_lidos, registros_gravados, erros from sync_execucoes order by iniciado_em desc limit 5;
   select * from sync_erros order by criado_em desc limit 10;
   select relname, pg_size_pretty(pg_total_relation_size(relid)) from pg_catalog.pg_statio_user_tables order by pg_total_relation_size(relid) desc limit 10;
   ```
6. Rode o mesmo comando de novo e confirme que as contagens não aumentaram indevidamente.
7. `npm run dev` e abra http://localhost:3000/licitacoes.

Se a fonte responder 429/5xx, registre no relatório — não aumente a concorrência para "forçar".
