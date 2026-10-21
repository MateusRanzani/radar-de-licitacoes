# Cotação de preços — planejamento

> Status: **planejado, não implementado**. Fontes e endpoints verificados com chamadas reais em 2026-10-21.

## 1. Objetivo

O usuário digita um produto (ex.: "dipirona"). A tela busca compras públicas **já homologadas**, mostra o preço unitário que cada órgão pagou, deixa o usuário escolher quais preços entram e calcula o valor estimado pelos métodos admitidos em lei. **Nada é gravado no banco** na versão básica.

## 2. Fontes

### A. PNCP, chamado do navegador (base da v1)

| Passo | Endpoint | O que traz |
|---|---|---|
| 1. Achar as compras | `https://pncp.gov.br/api/search/?q=dipirona&tipos_documento=edital&status=todos` | Compras que citam o termo. Campo `tem_resultado` indica se já há vencedor. `q=dipirona` → **19.441** compras |
| 2. Itens da compra | `https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens` | `descricao`, `unidadeMedida`, `quantidade`, `valorUnitarioEstimado`, `situacaoCompraItemNome` ("Homologado"), `temResultado`, `catalogoCodigoItem` (CATMAT, às vezes) |
| 3. Preço pago | `.../itens/{numeroItem}/resultados` | `valorUnitarioHomologado`, `quantidadeHomologada`, `nomeRazaoSocialFornecedor`, `niFornecedor`, `dataResultado`, `porteFornecedorNome` |

Exemplo real: compra `78680337000770-1-000087/2026`, item 1. Dipirona Sódica 500 mg/ml, ampola 2 ml, **R$ 0,3990/unidade**, fornecedor Londricir, resultado em 19/03/2026.

- CORS: os endpoints de itens e resultados respondem `access-control-allow-origin: *`, então dá para chamar do navegador.
- **A busca acerta a compra, não o item.** Para "dipirona" veio uma compra da Marinha cujo único item é um notebook. Por isso é obrigatório filtrar os itens pela descrição.
- **N+1 chamadas.** Cada compra pede mais duas consultas (itens e resultados). Na v1, o limite é de cerca de 20 compras por rodada, com botão "carregar mais" e progresso visível.
- **Cobertura:** todas as esferas (municipal, estadual, federal).
- A busca `/api/search/` não é oficial (ver [fontes/pncp.md](fontes/pncp.md)).

### B. Compras.gov.br — pesquisa de preços (fase 2)

| Endpoint | Parâmetros | O que traz |
|---|---|---|
| `https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial` | `tipo=codigoItemCatalogo` (ou `codigoPdm`), `codigo`*, `estado`, `esfera`, `poder`, `dataCompraInicio`, `dataCompraFim`, `pagina`, `tamanhoPagina` | `precoUnitario`, `marca`, `nomeFornecedor`, `nomeUasg`, `nomeOrgao`, `estado`, `municipio`, `dataCompra`, `dataResultado`, `siglaUnidadeFornecimento`, `quantidade` |
| `.../modulo-pesquisa-preco/3_consultarServico` | equivalente para serviços (CATSER) | |
| Swagger | `https://dadosabertos.compras.gov.br/v3/api-docs` | |

- É a fonte oficial que substitui o Painel de Preços. Teste com o código 618642 (notebook) → 33 preços.
- **Exige código CATMAT.** A busca por descrição (`modulo-material/4_consultarItemMaterial?descricaoItem=dipirona`) devolveu 0. Caminho viável: pegar o código em `catalogoCodigoItem` dos itens do PNCP.
- **Sem CORS para o navegador** (403 com `Origin` externo). Teria que passar por uma Route Handler do nosso servidor, só com cache e sem gravar.
- **Cobertura menor:** só o que passou pelo Compras.gov.br (federal e órgãos aderentes).

## 3. Base legal do cálculo

Fontes: Lei 14.133/2021, art. 23, e IN SEGES/ME nº 65/2021, arts. 5º e 6º.

| Regra | Onde | Na tela |
|---|---|---|
| Métodos: **média, mediana ou menor** dos valores | IN 65, art. 6º, caput | Mostrar os três; usuário escolhe |
| Cálculo sobre **3 ou mais preços** | art. 6º, caput | Alerta quando houver menos de 3 |
| Menos de 3 só com justificativa e aprovação | art. 6º, § 5º | Mensagem explicando a exigência |
| Desconsiderar **inexequíveis, inconsistentes e excessivamente elevados** | art. 6º, caput | Caixa por preço para incluir ou excluir |
| Critério de desconsideração fundamentado e descrito no processo | art. 6º, § 3º | Mostrar o critério aplicado e o motivo de cada exclusão |
| Análise crítica quando houver grande variação | art. 6º, § 4º | Coeficiente de variação, com alerta |
| Outros métodos, se justificados | art. 6º, § 1º | Permitidos, com aviso |
| Prioridade: sistemas oficiais e contratações similares **do último ano** | art. 5º, I, II e § 1º | Período padrão de 12 meses |
| Preços antigos com índice de atualização | art. 5º, I e II | Fase posterior |

### Critérios de saneamento (prática, não lei)

Usados por órgãos e citados em orientações do TCU. A tela os mostra como **"critério sugerido — exige justificativa"**:

- **Média saneada:** excluir valores abaixo de 70% ou acima de 130% da média (ou da mediana) e recalcular.
- **Média ± 1 desvio padrão:** excluir o que estiver fora da faixa.
- **Coeficiente de variação (CV = desvio padrão ÷ média):** até 25%, costuma-se usar a média; acima disso, a mediana.

## 4. Fluxo da tela

1. **Busca:** palavra, período (padrão de 12 meses), UF e esfera.
2. **Agrupamento por apresentação:** dipirona aparece em ampola de 2 ml, comprimido de 500 mg, frasco de gotas. A tela agrupa por unidade e descrição, e o usuário escolhe o grupo. Misturar apresentações invalida a média.
3. **Tabela de preços.** Cada linha mostra:
   - preço unitário, unidade e quantidade
   - órgão e UF
   - fornecedor
   - data do resultado e modalidade
   - link para o PNCP
   - caixa para incluir o preço
4. **Resumo:**
   - quantidade de preços considerados
   - menor, maior, média e mediana
   - coeficiente de variação
   - alertas (menos de 3 preços, variação alta)
5. **Origem:** fonte, link original e data da consulta em cada preço.

## 5. Regras de implementação

- **Dinheiro:** o PNCP manda valores com 4 casas decimais (`0.3990`). Toda conta usa inteiros em décimos de milésimo de real (0,3990 vira `3990`), nunca `float`. A mediana de quantidade par arredonda de forma explícita e documentada.
- Ausente na fonte = "Não informado". Nenhum número estimado ou de exemplo na UI.
- Datas exibidas em `America/Sao_Paulo`.
- Chamadas do navegador com concorrência limitada (ex.: 4 simultâneas) e novas tentativas, como em `src/lib/pncp-search.ts`.

## 6. Escopo

**v1 (básico)**
- Fonte A (PNCP pelo navegador)
- Agrupamento por unidade
- Seleção manual de preços
- Média, mediana, menor e coeficiente de variação
- Sugestão de descarte por média saneada

**Depois**
- Fonte B (Compras.gov.br por código CATMAT, via servidor)
- Exportar o mapa de preços em PDF ou CSV para o processo
- Salvar cotações por usuário (passa a usar o banco, com migração)
- Correção dos preços antigos por índice de inflação

## 7. Arquivos previstos

- `src/lib/cotacao/pncp-precos.ts`: busca, itens e resultados, com limite de chamadas
- `src/lib/cotacao/estatistica.ts`: média, mediana, menor, desvio, coeficiente de variação e saneamento, com testes Vitest
- `src/app/cotacao/page.tsx` e `src/components/cotacao/*`
- `docs/fontes/pncp.md`: registrar `status=todos`, `tem_resultado` e o endpoint de resultados
- `docs/fontes/comprasgov.md`: registrar a fonte B (fase 2)

## 8. Riscos

- A busca `/api/search/` do PNCP não é oficial e pode mudar.
- Com 20 compras, são cerca de 40 a 60 chamadas por busca. A tela fica mais lenta e precisa mostrar o progresso.
- O agrupamento automático por apresentação vai errar às vezes. A decisão final é sempre do usuário.
- Os critérios de saneamento não estão na lei. Quem cota precisa justificar o critério no processo.
