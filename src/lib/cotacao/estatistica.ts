// Estatísticas para cotação de preços com bigint — evita erros de ponto flutuante.
// Base legal: IN SEGES/ME nº 65/2021, art. 6º (média, mediana, menor preço, CV).
// 1 real = 10.000 unidades (4 casas decimais).

export const MULTIPLICADOR = 10_000n

/** Converte número com 4 casas decimais para bigint */
export function paraUnidades(valor: number): bigint {
  return BigInt(Math.round(valor * 10_000))
}

/** Converte unidades de volta para reais */
export function paraReais(u: bigint): number {
  return Number(u) / 10_000
}

/** Preço unitário com 2 a 4 casas — mostra as casas extras só quando a fonte as tem */
export function formatarPrecoUnitario(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 2, maximumFractionDigits: 4,
  }).format(valor)
}

/** R$ X,XX — duas casas, para resumo */
export function formatarPrecoResumido(u: bigint): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(paraReais(u))
}

// ─── Estatísticas ─────────────────────────────────────────────────────────── //

export interface Estatisticas {
  n:      number
  menor:  bigint
  maior:  bigint
  media:  bigint   // truncado para unidade inteira (erro < R$ 0,0001)
  mediana: bigint  // par: (a+b)/2 truncado
  desvio: bigint
  cv:     number   // coeficiente de variação em %, 2 casas
  cvAlto: boolean  // cv > 25 — art. 6º § 4º pede análise crítica
  poucos: boolean  // n < 3 — art. 6º § 5º exige justificativa
}

export function calcularEstatisticas(valores: bigint[]): Estatisticas | null {
  const n = valores.length
  if (n === 0) return null

  const sorted = [...valores].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

  const menor = sorted[0]
  const maior = sorted[n - 1]
  const soma  = sorted.reduce((acc, v) => acc + v, 0n)
  const media = soma / BigInt(n)  // trunca; erro máximo < R$ 0,0001 — aceitável

  // Mediana: par → (a+b)/2 truncado (documentado)
  const mediana =
    n % 2 === 1
      ? sorted[Math.floor(n / 2)]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2n

  // Desvio padrão: sqrt(Σ(xi-media)² / n) com PREC=10^4 de precisão interna
  const PREC = 10_000n
  const somaQuad = sorted.reduce((acc, v) => {
    const d = v - media
    return acc + d * d
  }, 0n)
  // sqrt(somaQuad * PREC² / n) / PREC
  const desvio = bigintSqrt(somaQuad * PREC * PREC / BigInt(n)) / PREC

  // CV = (desvio / media) × 100, 2 casas decimais
  const cv = media > 0n ? Math.round(Number(desvio * 10_000n / media)) / 100 : 0

  return { n, menor, maior, media, mediana, desvio, cv, cvAlto: cv > 25, poucos: n < 3 }
}

// Raiz quadrada inteira de bigint (Newton-Raphson, floor)
function bigintSqrt(n: bigint): bigint {
  if (n === 0n) return 0n
  let x = n
  let y = (x + 1n) / 2n
  while (y < x) { x = y; y = (x + n / x) / 2n }
  return x
}

// ─── Saneamento automático ───────────────────────────────────────────────── //

export interface SugestaoDescarte {
  id:     string
  motivo: string
}

/**
 * Sugere descartes pela média saneada (< 70% ou > 130% da média).
 * Critério de prática, não lei — art. 6º § 3º exige justificativa no processo.
 */
export function sugerirDescarte(precos: { id: string; valor: bigint }[]): SugestaoDescarte[] {
  if (precos.length < 3) return []

  const soma  = precos.reduce((acc, p) => acc + p.valor, 0n)
  const media = soma / BigInt(precos.length)

  const lim70  = media * 70n / 100n
  const lim130 = media * 130n / 100n

  return precos.flatMap((p) => {
    if (p.valor < lim70)  return [{ id: p.id, motivo: "Abaixo de 70% da média (possivelmente inexequível)" }]
    if (p.valor > lim130) return [{ id: p.id, motivo: "Acima de 130% da média (possivelmente excessivo)" }]
    return []
  })
}
