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

## Busca textual do portal (`/api/search`) — NÃO documentada oficialmente

Verificada por chamadas reais em 2026-10-20. É o serviço por trás da busca de https://pncp.gov.br/app/editais. Não consta no Swagger; pode mudar sem aviso.

`GET https://pncp.gov.br/api/search/?q=<texto>&tipos_documento=edital&status=<status>&pagina=1&tam_pagina=<n>`

| Parâmetro | Verificado | Observação |
|---|---|---|
| `q` | sim | busca também na descrição dos **itens** (ex.: `q=seringa` retornou edital cujo título é "insumos odontológicos" e cujo item é "Seringa carpule…") |
| `tipos_documento=edital` | sim | outros valores não testados |
| `status=recebendo_proposta` | sim | `q=seringa` → 733; sem `q` → 38.401 (≠ 29.045 de `/v1/contratacoes/proposta`; critério diferente, não investigado) |
| `ufs` | sim | `ufs=SP` → 146; vários com `\|`: `ufs=SP\|RJ` → 181 |
| `esferas` | sim | `esferas=M` → 472 |
| `modalidades` | sim | `modalidades=6` → 662; `8` → 33; `6\|8` → 695 |
| `ordenacao` | sim | `-data` = publicação mais recente; `data` = mais antiga; omitido = relevância |
| `pagina`, `tam_pagina` | sim | `tam_pagina=100` ok; `500` caiu 5×; usar ≤ 100 |
| `status=encerradas`, `status=todos`, `data_inicial/data_final` | não confirmado | chamadas caíram; aparecem em projetos de terceiros |

Resposta: `{ items: [...], total }`, 101 campos por item (ex.: `numero_controle_pncp`, `title`, `description`, `orgao_nome`, `orgao_cnpj`, `ano`, `numero_sequencial`, `uf`, `municipio_nome`, `esfera_id`, `modalidade_licitacao_id/nome`, `situacao_id/nome`, `valor_total_estimado`, `indicador_orcamento_sigiloso`, `srp`, `data_publicacao_pncp`, `data_inicio_vigencia`, `data_fim_vigencia`, `usuario_nome`). Valores de id vêm como **string**.

**Prazo de proposta (verificado 6/6 contra `dataAberturaProposta`/`dataEncerramentoProposta` do detalhe, 2026-10-20):** em editais, `data_inicio_vigencia` = abertura de propostas e `data_fim_vigencia` = encerramento. `data_inicio/fim_recebimento_propostas` vieram vazios em todos.

Cabeçalhos: `access-control-allow-origin: *` (o navegador pode chamar direto) e `cache-control: max-age=120`.

**Confiabilidade:** o servidor derruba parte das conexões sem status HTTP (`ECONNRESET`), conforme o cliente — anti-bot. Nos testes: curl ≈ 50% de sucesso, Node 2/6. Relato público com medições: https://github.com/ddeliberador/motor4pufpr/issues/51 (navegador 10/10). Não mascarar User-Agent como navegador; preferir chamada a partir do navegador do usuário, ou pedir liberação ao PNCP.

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
