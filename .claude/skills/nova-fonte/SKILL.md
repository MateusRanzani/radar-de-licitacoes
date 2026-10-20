---
name: nova-fonte
description: Roteiro para investigar e adicionar uma nova fonte de licitações (portal de compras) ao LicitaRadar — pesquisa da API oficial, documentação, stub ou conector completo, fixtures reais, testes e registro no admin. Use quando o usuário pedir para integrar um portal (ex. "/nova-fonte bll").
---

# Nova fonte de dados

Argumento: slug da fonte (ex. `comprasgov`, `bll`). Delegue a implementação ao agente `connector-engineer` quando fizer sentido.

## 1. Investigação (sem código)
1. Procure documentação oficial: portal de dados abertos, OpenAPI/Swagger, manuais de integração, termos de uso. Anote URLs.
2. Faça chamadas reais com `curl` para cada endpoint candidato; registre status, paginação, limites e um exemplo de campos.
3. Verifique se a fonte já publica no PNCP (Lei 14.133) e se expõe `numeroControlePNCP` — isso define a estratégia de deduplicação.
4. Decida: **API pública utilizável** → conector completo; **sem API/termos restritivos** → stub `planejada`. Nunca raspar contornando bloqueios ou termos.

## 2. Documentação
Crie `docs/fontes/<slug>.md` no formato de `docs/fontes/pncp.md`: status, endpoints verificados (com data), paginação/limites, volume, campos, pontos de atenção, o que falta.

## 3. Código
```
src/modules/connectors/<slug>/
  index.ts          # export do conector registrado no registry do core
  client.ts         # chamadas HTTP via core/http
  map.ts            # normalizar(bruto) -> LicitacaoNormalizada (puro)
  map.test.ts       # testes com fixtures reais
  __fixtures__/     # respostas reais gravadas (sem dados pessoais)
  README.md         # resumo + link para docs/fontes/<slug>.md
```
- Stub: implementa a interface lançando `ConectorNaoImplementado`, com `status: 'planejada'`.
- Migração (skill `/migracao`) inserindo a linha em `fontes` com status correto.

## 4. Verificação
- `npm test -- connectors/<slug>` verde.
- Sync curta real executada 2× sem duplicatas (só conector completo).
- Admin mostra a fonte com o status correto; fonte `planejada` não aparece como opção funcional na busca.
- Rode o agente `data-integrity-reviewer` no diff.
