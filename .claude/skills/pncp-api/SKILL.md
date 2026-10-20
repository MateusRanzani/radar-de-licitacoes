---
name: pncp-api
description: Referência verificada da API pública do PNCP (endpoints, parâmetros obrigatórios, paginação, limites, campos) e como reverificá-la. Use ao escrever ou depurar o conector PNCP ou quando surgir dúvida sobre o que a API oferece.
---

# API do PNCP

Fonte de verdade do projeto: `docs/fontes/pncp.md`. Leia-o primeiro.

## Reverificar (faça quando algo divergir ou antes de usar um endpoint novo)

Listar endpoints e parâmetros da spec oficial:
```bash
curl -s https://pncp.gov.br/api/consulta/v3/api-docs -o "$TMP/pncp.json"
node -e "const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));for(const[p,v]of Object.entries(d.paths))for(const[m,o]of Object.entries(v))console.log(m.toUpperCase(),p,(o.parameters||[]).map(x=>x.name+(x.required?'*':'')).join(','))" "$TMP/pncp.json"
```

Chamada real de amostra (datas AAAAMMDD, `tamanhoPagina` ≤ 50):
```bash
curl -s "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=AAAAMMDD&dataFinal=AAAAMMDD&codigoModalidadeContratacao=6&pagina=1&tamanhoPagina=50"
```

Detalhes de uma contratação (`cnpj`, `anoCompra`, `sequencialCompra` vêm do registro):
```bash
curl -s "https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens"
curl -s "https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos"
curl -s "https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/historico"
```

## Regras
- Endpoint ou campo que não estiver em `docs/fontes/pncp.md` só pode ser usado depois de confirmado com os comandos acima — e então registrado lá com a data.
- Para gravar fixture: salve a resposta real em `src/modules/connectors/pncp/__fixtures__/<nome>.json`, recortando para poucos registros.
- Domínios (modalidades etc.): `GET https://pncp.gov.br/api/pncp/v1/modalidades` — sincronize para tabela, não hardcode nomes.
