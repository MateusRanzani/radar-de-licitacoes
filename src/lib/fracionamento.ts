/**
 * Agrupamento de dispensas por similaridade de objeto.
 *
 * O teto do art. 75 da Lei 14.133/2021 vale por objeto, não por órgão no ano.
 * Somar tudo que um órgão dispensou e comparar com o teto marca qualquer
 * município de porte médio como irregular. Fracionamento é o MESMO objeto
 * repartido em várias dispensas, então a soma só faz sentido dentro de um
 * grupo de objetos parecidos.
 */

// Ruído de redação que aparece em quase toda dispensa e aproximaria objetos
// que não têm relação nenhuma entre si.
const RUIDO = new Set([
  "aquisicao", "aquisicoes", "contratacao", "contratacoes", "empresa", "empresas",
  "prestacao", "servico", "servicos", "fornecimento", "futura", "futuras",
  "eventual", "eventuais", "objeto", "visando", "atender", "atendimento",
  "necessidade", "necessidades", "secretaria", "secretarias", "municipal",
  "municipio", "prefeitura", "departamento", "diversos", "diversas",
  "para", "pelo", "pela", "com", "sem", "por", "dos", "das", "nos", "nas",
  "que", "ser", "sao", "seu", "sua", "este", "esta", "esse", "essa",
])

export function normalizarObjeto(texto: string): string {
  return texto
    .toLowerCase()
    // Prefixos do sistema de origem, ex. "[Portal de Compras Públicas] - ".
    // São idênticos entre dispensas sem relação e inflavam a similaridade.
    .replace(/\[[^\]]*\]/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // remove acentos
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b\d+\b/g, " ")          // quantidades variam entre dispensas do mesmo objeto
    .split(/\s+/)
    .filter((t) => t.length > 2 && !RUIDO.has(t))
    .join(" ")
    .trim()
}

export function trigramas(texto: string): Set<string> {
  const s = ` ${texto} `
  const out = new Set<string>()
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3))
  return out
}

export function similaridade(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersecao = 0
  const [menor, maior] = a.size <= b.size ? [a, b] : [b, a]
  for (const t of menor) if (maior.has(t)) intersecao++
  return intersecao / (a.size + b.size - intersecao)  // Jaccard
}

/**
 * Agrupa por similaridade transitiva (union-find): A~B e B~C colocam os três
 * no mesmo grupo, o que é o comportamento desejado para variações de redação
 * do mesmo objeto.
 */
export function agruparPorObjeto<T>(
  itens: T[],
  textoDe: (item: T) => string,
  limiar: number,
): T[][] {
  const n = itens.length
  const pai = Array.from({ length: n }, (_, i) => i)
  const raiz = (i: number): number => {
    while (pai[i] !== i) { pai[i] = pai[pai[i]]; i = pai[i] }
    return i
  }
  const unir = (a: number, b: number) => {
    const ra = raiz(a), rb = raiz(b)
    if (ra !== rb) pai[rb] = ra
  }

  const tris = itens.map((it) => trigramas(normalizarObjeto(textoDe(it))))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (similaridade(tris[i], tris[j]) >= limiar) unir(i, j)
    }
  }

  const grupos = new Map<number, T[]>()
  for (let i = 0; i < n; i++) {
    const r = raiz(i)
    const g = grupos.get(r)
    if (g) g.push(itens[i])
    else grupos.set(r, [itens[i]])
  }
  return [...grupos.values()]
}
