# LicitaRadar — Design system

Referência visual: [design/referencia-visual-01.jpg](design/referencia-visual-01.jpg) (dashboard de procurement em estilo *liquid glass*).

## 1. O que levar da referência

- Fundo claro e neutro, com muito respiro. Um **título grande** de página (display) ao lado de um botão de busca circular escuro.
- **Navegação em pílulas** no topo: o item ativo é uma pílula preenchida na cor de assinatura e os demais são texto simples. Atalhos em **ícones circulares** numa coluna à esquerda.
- **Cards de vidro**: translúcidos, com cantos bem arredondados (24–28px), desfoque do fundo e borda sutil clara.
- **KPIs grandes** com uma variação pequena sobrescrita e colorida (↑ verde, ↓ vermelho), e *sparklines* finas dentro dos cards.
- **Mapa com mapa de calor** na cor de assinatura e marcadores com balões de vidro. No nosso caso é o **mapa do Brasil por UF**.
- **Painéis escuros** (aqui em azul-marinho) para tabelas densas, com abas segmentadas (Todos, Diário, Semanal, Mensal, Anual) e cabeçalhos em caixa alta com ordenação.

## 2. Paleta

| Token | Hex | Uso |
|---|---|---|
| `--brand` (laranja neon, assinatura) | `#FF5A1F` | ação principal, item de navegação ativo, indicador selecionado, detalhes de IA, mapa de calor |
| `--brand-vivid` (laranja elétrico) | `#FF6D00` | hover/pressed de botões, gradientes de destaque |
| `--brand-ink` (laranja para texto) | `#C2410C` | links e texto laranja sobre fundo claro (contraste AA 4,7:1) |
| `--navy` (azul-marinho) | `#101828` | cabeçalho, textos fortes, painéis escuros, botão de busca |
| `--canvas` (cinza quase branco) | `#F5F7FA` | fundo principal |
| `--surface-glass` | `rgb(255 255 255 / 0.55)` | cards de vidro sobre o canvas |
| `--surface-glass-dark` | `rgb(16 24 40 / 0.88)` | painéis escuros (tabelas) |
| `--border-glass` | `rgb(255 255 255 / 0.6)` | borda clara dos cards de vidro |
| `--text` / `--text-muted` | `#101828` / `#475467` | texto principal e secundário |
| `--success` / `--danger` / `--warning` | `#12B76A` / `#F04438` / `#F79009` | variações, erros e prazo próximo (sempre acompanhados de texto ou ícone) |

### Contraste (WCAG AA)
- Branco sobre `#FF5A1F` dá **3,1:1**, o que só passa para texto grande (≥ 18,66px negrito) e ícones. Em botões com texto normal, use **texto `#101828` sobre laranja (5,6:1)** ou texto branco em negrito ≥ 19px.
- Laranja `#FF5A1F` como texto sobre `#F5F7FA` dá 2,9:1, e **não passa**. Para texto use `--brand-ink`.
- `#101828` sobre `#F5F7FA` dá cerca de 17:1.

## 3. Liquid glass — implementação

```css
.glass {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--border-glass);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .7), 0 8px 32px rgb(16 24 40 / .08);
  border-radius: 28px;
}
@supports not (backdrop-filter: blur(1px)) { .glass { background: rgb(255 255 255 / .92); } }
@media (prefers-reduced-transparency: reduce) { .glass { background: #fff; backdrop-filter: none; } }
```

- **Desempenho**: no máximo cerca de 6 superfícies com `backdrop-filter` visíveis ao mesmo tempo. Listas longas de resultados usam cards opacos (`#fff`, borda sutil), e o vidro fica reservado para a navegação, os KPIs, o painel de filtros e os modais.
- O vidro precisa de algo atrás para refratar. Use manchas de gradiente sutis e estáticas no canvas (laranja e azul-marinho, com baixa opacidade) ou o mapa, nunca uma animação contínua.

## 4. Tipografia e forma

- Fonte: **Inter Tight** ou **Geist** via `next/font` (sem layout shift), com números tabulares (`font-variant-numeric: tabular-nums`) em valores e KPIs.
- Escala: display 48–64px com peso 500 e tracking negativo (títulos de página); KPI 40px; título de card 20px; corpo 15–16px; legendas 13px.
- Raios: pílulas `9999px`, cards 24–28px, inputs 14px. Espaçamento em base 4, com gutter mínimo de 16px no celular.
- Ícones: lucide, traço 1,5px, dentro de botões circulares de 44px (área de toque).

## 5. Componentes-chave do LicitaRadar

| Componente | Aplicação da referência |
|---|---|
| Topo | logo + navegação em pílulas (Painel, Buscar, Acompanhamento, Pesquisas salvas, Admin), com o ativo em `--brand` e texto `--navy` |
| Barra de busca | campo grande de vidro com o botão circular `--navy`, em destaque na home e na página de busca |
| Painel de filtros | folha de vidro expansível (lateral no desktop, *bottom sheet* no celular), com chips de filtros ativos removíveis um a um e o botão "Limpar tudo" |
| Card de resultado | opaco, com número/título, objeto resumido, órgão, município/UF, modalidade, selo do portal, valor, prazo (destaque `--warning` quando próximo), selo "Aberta" **apenas** para status confirmado e rodapé "Dados de dd/mm/aaaa hh:mm · ver na fonte ↗" |
| KPIs do painel | cards de vidro com número grande, variação no período e *sparkline* |
| Mapa | mapa do Brasil por UF em gradiente de `--brand` com balões de vidro (contagem por UF); clicar aplica o filtro |
| Tabelas densas | painel `--navy` com abas segmentadas de período e ordenação nos cabeçalhos |
| IA (fase 6) | detalhes em `--brand` com um ícone de faísca e a citação da fonte sempre visível |

## 6. Acessibilidade e responsividade

- Foco visível com um anel de 2px `--brand` e offset de 2px. Navegação completa por teclado, garantida pelos componentes Radix.
- Status e prazos nunca são indicados só por cor: sempre vêm com texto ou ícone.
- Celular primeiro: a navegação em pílulas vira uma barra inferior ou um menu, a coluna de ícones some, os KPIs ficam em carrossel e as tabelas viram cards.
- Respeitar `prefers-reduced-motion` e `prefers-reduced-transparency`.
- Tema escuro: não está no escopo inicial, mas os tokens já ficam prontos para ele.
