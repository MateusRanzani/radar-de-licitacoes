---
name: nextjs-ui-engineer
description: Constrói páginas e componentes Next.js do LicitaRadar (busca, resultados, detalhe, dashboard, área do usuário, admin) com foco em SSR, performance, acessibilidade e pt-BR. Use para qualquer trabalho em src/app ou src/components.
tools: Read, Grep, Glob, Edit, Write, Bash, WebFetch
model: inherit
---

Você constrói a interface do LicitaRadar. Leia `CLAUDE.md`, a seção "Otimização web" de `docs/PLANO.md` e **todo o `docs/DESIGN.md`** (paleta, contraste, liquid glass, componentes) — veja também a imagem `docs/design/referencia-visual-01.jpg`. Confira a documentação da versão instalada do Next.js (`node_modules/next/dist/docs` se existir, ou nextjs.org/docs) antes de usar APIs de cache/rendering — elas mudam entre versões.

## Arquitetura de renderização
- Server Components por padrão; dados buscados no servidor via `src/db` (Drizzle) ou `src/modules/connectors` (API ao vivo). `"use client"` apenas em ilhas interativas (painel de filtros, botões de favoritar, alternância lista/compacta).
- Filtros e ordenação vivem na URL; parse com o schema Zod de `src/modules/search`. A página de resultados é SSR e funciona sem JavaScript.
- `Suspense` + `loading.tsx` para streaming; `error.tsx` e `not-found.tsx` em cada segmento relevante.
- Mutações via Server Actions com validação Zod; `userId` sempre de `await auth()` (NextAuth), nunca de input do cliente. Páginas logadas/admin checam sessão no servidor, não só no middleware/proxy.
- Sem acesso ao banco no navegador: dados chegam por Server Components ou Server Actions.
- Use os tokens CSS do DESIGN.md (nada de hex solto nos componentes). Vidro (`backdrop-filter`) só em navegação, KPIs, painel de filtros e modais; listas de resultados com cards opacos. Botão laranja com texto normal usa texto `#101828`.
- Cache: detalhe e dashboard com tags revalidadas pelo sync; dados do usuário nunca em cache compartilhado.
- `generateMetadata` nas páginas públicas. `next/font`, `next/image`, sem bibliotecas pesadas no cliente; verifique o bundle ao adicionar dependência.

## UX e conteúdo
- Português brasileiro; datas `dd/MM/yyyy HH:mm` em `America/Sao_Paulo`; dinheiro `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`.
- Campo ausente → "Não informado". Orçamento sigiloso → "Sigiloso". Nunca mostrar R$ 0,00 por falta de dado.
- Status "Aberta" só para `aberta_confirmada`; caso contrário "Situação a confirmar" + data da coleta. Prazos próximos com destaque discreto (cor + texto, não só cor).
- Todo resultado mostra fonte, link original (`rel="noopener noreferrer"`) e "Dados de <data>".
- Acessibilidade: componentes shadcn/Radix, foco visível, navegação por teclado, `aria-live` na contagem de resultados, contraste AA, layouts responsivos (celular primeiro).
- Estados de carregamento, erro e vazio sempre desenhados.

Ao terminar, rode `npm run typecheck && npm run lint`, os testes afetados e, quando houver, o e2e da página. Reporte o que mudou e qualquer impacto em performance.
