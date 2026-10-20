# LicitaRadar — Documento-base do projeto

> Leia este documento primeiro sempre que retomar o projeto sem contexto.
> Detalhes técnicos e status das fases: [PLANO.md](PLANO.md) · Visual: [DESIGN.md](DESIGN.md) · Fontes: [fontes/](fontes/)

## 1. O quê

O LicitaRadar é uma aplicação web que reúne em um só lugar as licitações públicas brasileiras (pregões, dispensas, concorrências etc.) publicadas em diferentes portais. Com ela é possível pesquisar por palavra-chave e por filtros avançados, analisar as oportunidades e acompanhá-las com alertas.

## 2. Por quê

- As oportunidades estão espalhadas em vários portais (PNCP, Compras.gov.br, BLL e outros), cada um com uma interface, um formato e regras de busca diferentes.
- A API oficial do PNCP **não oferece busca por palavra-chave**: só filtra por data, modalidade, UF, município e CNPJ, com no máximo 50 registros por página. Por isso não dá para perguntar "quais pregões de software estão abertos em SP?" direto à fonte.
- Acompanhar prazos e mudanças manualmente é trabalhoso e sujeito a erro. Perder um prazo é perder o negócio.
- Hoje não existe um lugar confiável que mostre, para cada dado, **de onde ele veio e quando foi coletado**.

## 3. Para quê (e para quem)

Para empresas e profissionais que vendem para o governo, como fornecedores, consultorias e equipes comerciais de licitação, conseguirem:
1. **Encontrar** rapidamente as oportunidades relevantes, filtrando por objeto, local, valor, prazo e modalidade.
2. **Avaliar** cada oportunidade com todos os dados publicados: itens, documentos, datas e histórico.
3. **Acompanhar** o que interessa com favoritos, notas, status pessoal (Nova, Analisar, Interessante, Participar, Descartada), pesquisas salvas e alertas por e-mail.
4. **Decidir** com mais informação, primeiro pelo painel de indicadores e depois com recursos de IA que sempre citam as fontes.

## 4. Como funciona

```
Portais (PNCP, ...) ──conectores──▶ Sincronização periódica ──▶ Banco (índice de busca)
                                                                       │
Usuário ◀── páginas geradas no servidor (Next.js) ◀── busca/filtros ───┘
         ◀── detalhes ao vivo da fonte (itens, documentos), com cache
         ◀── alertas por e-mail (novas oportunidades e mudanças)
```

- **Conectores**: há um módulo independente para cada portal. Eles usam apenas APIs oficiais ou documentadas e convertem os dados para um modelo interno único.
- **Por que guardar dados em vez de consultar as APIs na hora**:
  1. A API oficial não busca texto, então a busca por palavra-chave exige um índice próprio.
  2. Filtrar e combinar várias fontes de uma vez exige tê-las no mesmo lugar.
  3. Para avisar "isto mudou" ou "isto é novo" é preciso comparar com o que foi visto antes.
  4. Favoritos, notas e alertas precisam apontar para um registro estável.
  5. Os números do painel (por exemplo, cerca de 29 mil licitações abertas) exigiriam centenas de chamadas a cada visita.
  6. As fontes ficam lentas ou indisponíveis, e um índice local mantém o sistema de pé.
- **O que fica guardado** (tudo no mesmo Postgres):
  1. **Operacional**: as licitações completas e pesquisáveis (abertas, mais as encerradas há até 60 dias, mais as favoritadas ou acompanhadas). Itens e documentos são buscados na fonte sob demanda, com cache.
  2. **BI enxuto** (`bi_fatos`): uma linha por contratação, só com códigos e números (data, UF, município, modalidade, esfera, categoria, valores em centavos), desde jan/2024. São cerca de 120 a 170 MB por ano (estimativa a confirmar). Os gráficos leem resumos mensais pré-calculados.
  3. O próprio PNCP serve de arquivo: para reclassificar ou detalhar algo antigo, o sistema busca de novo na API.
- **Duas camadas entre fontes**: a mesma licitação aparece no PNCP e no portal onde é disputada (Compras.gov.br, BLL...). `registros_fonte` guarda o que cada portal disse e nunca é apagado. `contratacoes` é a licitação unificada que o usuário vê. A ligação entre as duas usa o número de controle PNCP ou uma heurística com grau de confiança.
- **Confiabilidade**: nunca inventamos dados. Campo ausente aparece como "não informado". "Aberta" só aparece quando o status está confirmado. Toda licitação mostra a fonte, o link original e a data da coleta.

## 5. Com o quê

| Necessidade | Tecnologia |
|---|---|
| Aplicação web otimizada (geração no servidor, streaming) | Next.js (App Router, Server Components) + TypeScript |
| Visual | Tailwind CSS v4 + shadcn/ui (Radix), visual *liquid glass*, ver [DESIGN.md](DESIGN.md) |
| Banco de dados e busca textual | **Neon** Postgres, plano gratuito de 1 GB (`unaccent` + `pg_trgm`; `pgvector` no futuro) + Drizzle ORM |
| Login | NextAuth (Auth.js) com sessão JWT: e-mail e senha + link mágico por e-mail |
| E-mail (link mágico, alertas) | Resend (gratuito) |
| Tarefas periódicas | GitHub Actions / cron-job.org chamando rotas protegidas do Next.js |
| Hospedagem | Vercel Hobby (gratuito, uso não comercial) + Neon |
| Testes | Vitest, Playwright |
| Ambiente local | Postgres em Docker + `next dev` |

Restrição: **planos gratuitos** enquanto possível.

Um único projeto Next.js, organizado em módulos (`src/modules/*`), sem microserviços.

## 6. Resultado final esperado

**Primeira versão (fases 1–4):**
- Uma busca central com palavras-chave (frase exata, inclusão e exclusão de termos, sem diferenciar acentos nem maiúsculas) e filtros combináveis: categoria, região, UF, município, órgão, esfera, valor, datas, modalidade, situação e portal.
- Resultados paginados em lista ou em modo compacto, com destaque para prazos próximos e fonte e link original em cada licitação.
- Uma página de detalhe com os dados completos, itens, documentos, histórico, ações de favoritar e anotar, e status pessoal.
- Um painel com indicadores reais: totais, novas, abertas confirmadas, prazos próximos, distribuição por categoria, UF e portal, e status das sincronizações.
- Login, pesquisas salvas e alertas por e-mail sem duplicidade e com frequência configurável.
- Uma área administrativa com o estado dos conectores, as sincronizações, os erros e as quantidades importadas.
- Dados reais do PNCP sincronizados automaticamente, sem duplicar registros.

**BI:** gráficos de evolução no tempo, valores, modalidades, esferas, categorias e tipos, mapa e ranking de estados e municípios, órgãos que mais compram e filtros cruzados. Histórico desde jan/2024, com aviso de cobertura.

**Evolução:** conectores para Compras.gov.br, BLL e outros portais, cada um documentado; classificação automática; extração de dados de editais; resumos e perguntas com IA sempre citando documento e trecho.

**Critérios de pronto da primeira versão:** os 10 critérios da seção 14 do briefing original. A primeira versão deve poder ser executada com instruções documentadas, ter migrações reproduzíveis, importar dados reais do PNCP sem duplicar, ter busca e filtros coerentes, mostrar a origem de cada registro, registrar os erros, ter testes nos fluxos principais e nunca apresentar uma integração inexistente como funcional. As etapas estão em [PLANO.md](PLANO.md#4-etapas--do-mais-simples-ao-mais-complexo).

## 7. Regras que nunca mudam

1. Não inventar endpoints, dados, valores, datas, documentos ou resultados.
2. Toda informação exibida tem origem e data de coleta.
3. Não apresentar como funcional uma integração que ainda não foi implementada.
4. Os dados de cada usuário são privados e o acesso a eles acontece só no servidor.
5. Nenhuma chave ou segredo no frontend nem no repositório.
6. Trabalhar em fases, com testes verdes e o projeto executável ao final de cada uma, e um relatório por fase.

## 8. Decisões já tomadas (histórico)

| Data | Decisão |
|---|---|
| 2026-10-20 | Next.js com foco em SSR e otimização web |
| 2026-10-20 | Somente planos gratuitos por enquanto → **Neon** (1 GB, sem pausa) em vez de Supabase (500 MB, pausa após 1 semana); Vercel Hobby |
| 2026-10-20 | BI com tabela enxuta `bi_fatos` no próprio Postgres, histórico desde 2024-01; sem armazenamento externo (R2 descartado) |
| 2026-10-20 | Duas camadas entre fontes: `registros_fonte` → `contratacoes` |
| 2026-10-20 | Etapas reordenadas do mais simples ao mais complexo; etapa 0 = interface com dados reais ao vivo do PNCP |
| 2026-10-20 | Login com NextAuth (Auth.js), sessão JWT (não Supabase Auth) |
| 2026-10-20 | E-mail via Resend |
| 2026-10-20 | Guardar um índice enxuto (cabeçalhos + busca); detalhes sob demanda — motivo na seção 4 |
| 2026-10-20 | Identidade visual: laranja neon #FF5A1F, laranja elétrico #FF6D00, azul-marinho #101828, fundo #F5F7FA, estilo *liquid glass* |
