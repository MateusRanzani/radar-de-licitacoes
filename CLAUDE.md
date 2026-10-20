# LicitaRadar

Plataforma de pesquisa, monitoramento e BI de licitações públicas brasileiras.
**Ao retomar sem contexto, leia nesta ordem:** [docs/PROJETO.md](docs/PROJETO.md) (o quê/por quê/resultado) → [docs/PLANO.md](docs/PLANO.md) (arquitetura e etapa atual) → [docs/DESIGN.md](docs/DESIGN.md) (visual).

## Stack
Next.js 16 (App Router, RSC, TypeScript estrito) · Tailwind v4 (liquid glass, tokens em DESIGN.md) · Neon Postgres + Drizzle ORM · NextAuth/Auth.js v5 (JWT) · Resend · Vitest · Playwright · Vercel Hobby. **Somente planos gratuitos** por enquanto.

## Comandos
- `npm run dev` — app (http://localhost:3000)
- `npm run typecheck && npm run lint && npm test` — checagem obrigatória antes de concluir qualquer tarefa
- (etapa 1+) `docker compose up -d db` · `npm run db:migrate` · `npm run db:reset`
- (etapa 2+) `npm run sync -- --fonte=pncp`

## Regras do projeto
- **Nunca inventar** endpoints, campos, valores, datas, documentos ou resultados. Endpoint novo só depois de verificado na documentação oficial ou em chamada real, registrado em `docs/fontes/<fonte>.md`.
- Ausente na fonte = "Não informado". Orçamento sigiloso = "Sigiloso". "Aberta" só com confirmação. Números e contagens sempre exatos — nenhum placeholder numérico na UI.
- Toda contratação exibe fonte, link original e data da coleta/consulta.
- Dinheiro: `numeric(18,4)` (operacional) ou `bigint` centavos (BI) — nunca float para somar. Datas `timestamptz`, exibidas em `America/Sao_Paulo`.
- Server Components por padrão; `"use client"` só para interação. Filtros vivem na URL.
- Banco acessado **só no servidor** (`src/db`, `import "server-only"`). Nenhum segredo em `NEXT_PUBLIC_*`.
- Dados de usuário sempre filtrados pelo `userId` de `auth()` — nunca vindo do cliente. Admin checado no servidor.
- Esquema só muda via migração Drizzle (skill `/migracao`). Tabelas/colunas em português sem acento, snake_case.
- Visual: siga [docs/DESIGN.md](docs/DESIGN.md) — laranja `#FF5A1F`, `#FF6D00` (hover), `#C2410C` (texto laranja), azul-marinho `#101828`, fundo `#F5F7FA`; vidro só em navegação/KPIs/filtros/modais; botão laranja com texto azul-marinho.
- UI em português brasileiro.
- Conector novo: `/nova-fonte`. Fim de etapa: `/fechar-fase`.
