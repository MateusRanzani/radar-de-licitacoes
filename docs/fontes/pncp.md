# Fonte: PNCP — Portal Nacional de Contratações Públicas

Status do conector: **planejado** (fase 2).
Última verificação manual da API: 2026-10-20.

## Endpoints verificados

API de consulta (pública, sem autenticação) — base `https://pncp.gov.br/api/consulta`
Spec OpenAPI: `https://pncp.gov.br/api/consulta/v3/api-docs` · Swagger: `https://pncp.gov.br/api/consulta/swagger-ui/index.html`

| Endpoint | Obrigatórios | Opcionais | Uso no LicitaRadar |
|---|---|---|---|
| `GET /v1/contratacoes/publicacao` | `dataInicial`, `dataFinal` (AAAAMMDD), `codigoModalidadeContratacao`, `pagina` | `codigoModoDisputa`, `uf`, `codigoMunicipioIbge`, `cnpj`, `codigoUnidadeAdministrativa`, `idUsuario`, `tamanhoPagina` | carga por janela de publicação |
| `GET /v1/contratacoes/proposta` | `dataFinal`, `pagina` | `codigoModalidadeContratacao`, `uf`, `codigoMunicipioIbge`, `cnpj`, ... | contratações com proposta em aberto |
| `GET /v1/contratacoes/atualizacao` | `dataInicial`, `dataFinal`, `codigoModalidadeContratacao`, `pagina` | iguais a publicacao | sincronização incremental |
| `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}` | — | — | recarregar um registro |

API principal (leitura pública) — base `https://pncp.gov.br/api/pncp`

| Endpoint | Retorno |
|---|---|
| `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens` | itens (descrição, material/serviço, quantidade, unidade, valores, ...) |
| `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos` | documentos (título, tipo, url, data) |
| `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico` | log de manutenção (inclusão/retificação/...) |
| `GET /v1/modalidades` | tabela de domínio de modalidades |

## Paginação e limites observados

- Resposta paginada: `{ data, totalRegistros, totalPaginas, numeroPagina, paginasRestantes, empty }`.
- `tamanhoPagina` máximo = **50** (51 e 100 retornam HTTP 400 "Tamanho de página inválido").
- Latência típica observada: ~0,3 s por página.
- Limite de taxa: **não documentado** — usar concorrência baixa (≤ 2) e backoff exponencial em 429/5xx.

## Volume observado (2026-10-19, por modalidade, `/publicacao`)

1: 8 · 4: 240 · 5: 11 · 6 (Pregão Eletrônico): 1524 · 7: 27 · 8 (Dispensa): 2643 · 9 (Inexigibilidade): 990 · demais: 0.
`/proposta` com `dataFinal=20261231`: 28.919 registros.

## Campos do registro (`RecuperarCompraPublicacaoDTO`)

`numeroControlePNCP` (id externo estável, ex. `88201298000149-1-001203/2026`), `anoCompra`, `sequencialCompra`, `numeroCompra`, `processo`, `objetoCompra`, `informacaoComplementar`, `orgaoEntidade{cnpj,razaoSocial,esferaId,poderId}`, `unidadeOrgao{ufSigla,municipioNome,codigoIbge,codigoUnidade,nomeUnidade}`, `modalidadeId/Nome`, `modoDisputaId/Nome`, `tipoInstrumentoConvocatorioCodigo/Nome`, `amparoLegal`, `srp`, `valorTotalEstimado`, `valorTotalHomologado`, `indicadorOrcamentoSigiloso`, `situacaoCompraId/Nome`, `dataPublicacaoPncp`, `dataAberturaProposta`, `dataEncerramentoProposta`, `dataAtualizacao`, `dataAtualizacaoGlobal`, `linkSistemaOrigem`, `linkProcessoEletronico`, `existeResultado`, `fontesOrcamentarias`, `orgaoSubRogado`, `unidadeSubRogada`.

## Pontos de atenção

- Datas vêm **sem fuso** (`2026-10-19T00:01:02`): tratadas como `America/Sao_Paulo`.
- `unidadeOrgao` é a localização do órgão, **não** do local de execução.
- `valorTotalEstimado` pode ser 0/nulo quando `indicadorOrcamentoSigiloso` — exibir "sigiloso", nunca R$ 0,00.
- Link público da contratação: montar a partir de cnpj/ano/sequencial somente após confirmar o padrão de URL no portal (fase 2); até lá usar `linkSistemaOrigem` quando presente.
