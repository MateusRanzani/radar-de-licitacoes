# Radar de licitações

Plataforma para pesquisar e monitorar licitações públicas brasileiras — pregões, dispensas, concorrências e outros processos publicados nos portais oficiais.

## O que faz

- **Busca por palavra-chave** no objeto e nos itens do edital (ex.: "seringa", "notebook", "merenda escolar")
- **Filtros combinados**: estado (UF), esfera (federal/estadual/municipal/distrital), modalidade, ordenação por relevância ou data
- **Página de detalhes** com itens, documentos e dados completos de cada edital
- **Acompanhamento pessoal**: favoritos, anotações e status por licitação (Nova, Analisar, Interessante, Participar, Descartada)
- **Painel BI**: KPIs, distribuição por modalidade, UF e esfera
- **Autenticação** com e-mail e senha

## APIs consultadas

| Portal | Uso | Tipo |
|--------|-----|------|
| **PNCP** — Portal Nacional de Contratações Públicas | Busca por palavra no portal (`/api/search/`) — chamada do navegador, CORS liberado, nada armazenado | Não oficial |
| **PNCP** — `/v1/contratacoes/proposta` | Lista de editais ao vivo e sincronização periódica para o banco local | Oficial |
| **PNCP** — `/v1/contratacoes/{cnpj}/{ano}/{seq}/itens` e `.../arquivos` | Itens e documentos na página de detalhe, consultados sob demanda | Oficial |

A busca por palavra roda diretamente do seu navegador — o servidor do PNCP bloqueia chamadas fora de navegador com frequência, por isso a chamada é feita do lado do cliente. Nenhum resultado de busca é armazenado.

Para alertas e combinação de múltiplas fontes, os dados de cabeçalho das licitações abertas são sincronizados periodicamente para um banco Postgres local via `npm run sync:pncp`.

## Stack

- **Next.js 16** (App Router, Server Components, TypeScript estrito)
- **Tailwind CSS v4** — tema *liquid glass*, laranja `#FF5A1F`, azul-marinho `#101828`
- **Neon Postgres** + **Drizzle ORM**
- **NextAuth/Auth.js v5** (JWT, Credentials)
- **Resend** (e-mail)
- **Vercel Hobby** (hospedagem)

## Rodando localmente

### Pré-requisitos

- Node.js 20+
- Docker (para o Postgres local)

### Configuração

```bash
# 1. Instale as dependências
npm install

# 2. Copie o arquivo de variáveis e preencha
cp .env.example .env.local
```

Variáveis necessárias no `.env.local`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/licitaradar
AUTH_SECRET=         # gere com: openssl rand -base64 32
RESEND_API_KEY=      # opcional — só para e-mails
NEXT_PUBLIC_URL=http://localhost:3000
```

### Banco de dados

```bash
# Sobe o Postgres na porta 5433
docker compose up -d db

# Cria as tabelas e insere dados iniciais (modalidades + municípios IBGE)
npm run db:migrate
npm run db:seed
```

### Sincronização (opcional)

Importa os editais abertos do PNCP para o banco local:

```bash
npm run sync:pncp
# ou com limite de páginas para testar:
npm run sync:pncp -- --maxPags=5
```

### Desenvolvimento

```bash
npm run dev
# http://localhost:3000
```

### Verificação antes de commitar

```bash
npm run typecheck && npm run lint
```

## Estrutura principal

```
src/
  app/                  # Páginas (App Router)
    licitacoes/         # Busca e detalhe de editais
    acompanhamento/     # Favoritos e anotações
    painel/             # BI e KPIs
    login/ cadastro/    # Autenticação
  components/
    licitacoes/         # Cards, filtros, busca
    layout/             # TopNav, Sidebar, UserMenu
    ui/                 # Badge, Spinner, Paginação
  lib/
    pncp.ts             # Cliente da API oficial PNCP
    pncp-search.ts      # Cliente da busca browser-side
    format.ts           # Formatação de datas, moedas, etc.
  db/
    schema/             # Esquema Drizzle (tabelas em português)
    index.ts            # Conexão (server-only)
  scripts/
    sync-pncp.ts        # Script de sincronização
docs/
  fontes/pncp.md        # Documentação dos endpoints usados e verificados
```

## Licença

Uso privado por enquanto.
