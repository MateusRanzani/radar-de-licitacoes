---
name: fechar-fase
description: Fecha uma fase do plano do LicitaRadar — roda verificação completa, auditoria de integridade, atualiza docs/PLANO.md e produz o relatório da fase (implementado, testes, como executar, pendências). Use ao terminar cada fase, antes de começar a próxima.
---

# Fechar fase

Argumento: número da fase (1–6).

1. Releia a linha da fase e seus critérios de saída em `docs/PLANO.md`.
2. Em paralelo, dispare os agentes:
   - `qa-verifier` — verificação completa da fase N.
   - `data-integrity-reviewer` — auditoria do diff da fase (`git diff <tag-fase-anterior>..HEAD`).
3. Corrija tudo que for bloqueante ou "corrigir antes de fechar" e repita o passo 2 para o que mudou. Não avance com teste vermelho.
4. Atualize `docs/PLANO.md`: marque a fase como concluída com data e registre decisões/limitações novas. Atualize `README.md` (instalação, execução, manutenção) se algo mudou.
5. Commit e tag `fase-N` (somente com autorização do usuário para commitar).
6. Responda ao usuário com o relatório:

```
## Fase N — <nome> concluída

### Implementado
- ...
### Testes executados
| Suíte | Resultado |
### Como executar
<comandos>
### Pendências e limitações
- ...
### Próxima fase
<resumo + decisões que dependem do usuário>
```

Seja literal: o que não foi verificado aparece como não verificado.
