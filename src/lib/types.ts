// Tipos derivados da API PNCP verificada em 2026-10-20
// Spec: https://pncp.gov.br/api/consulta/v3/api-docs

export interface PncpOrgao {
  cnpj: string
  razaoSocial: string
  esferaId: "F" | "E" | "M" | "D" | string
  poderId: string
}

export interface PncpUnidade {
  ufSigla: string
  ufNome: string
  municipioNome: string
  codigoIbge: string
  codigoUnidade: string
  nomeUnidade: string
}

export interface PncpAmparoLegal {
  nome: string
  descricao: string | null
  dispositivo: string | null
}

export interface PncpContratacao {
  numeroControlePNCP: string
  anoCompra: number
  sequencialCompra: number
  numeroCompra: string | null
  processo: string | null
  objetoCompra: string | null
  informacaoComplementar: string | null
  orgaoEntidade: PncpOrgao
  unidadeOrgao: PncpUnidade
  orgaoSubRogado: PncpOrgao | null
  unidadeSubRogada: PncpUnidade | null
  modalidadeId: number
  modalidadeNome: string
  modoDisputaId: number | null
  modoDisputaNome: string | null
  tipoInstrumentoConvocatorioCodigo: number | null
  tipoInstrumentoConvocatorioNome: string | null
  amparoLegal: PncpAmparoLegal | null
  srp: boolean
  valorTotalEstimado: number | null
  valorTotalHomologado: number | null
  indicadorOrcamentoSigiloso: boolean
  orcamentoSigilosoCodigo: string | null
  orcamentoSigilosoDescricao: string | null
  situacaoCompraId: number
  situacaoCompraNome: string
  dataPublicacaoPncp: string | null
  dataAberturaProposta: string | null
  dataEncerramentoProposta: string | null
  dataInclusao: string
  dataAtualizacao: string
  dataAtualizacaoGlobal: string | null
  linkSistemaOrigem: string | null
  linkProcessoEletronico: string | null
  existeResultado: boolean
  usuarioNome: string | null
}

export interface PncpPaginado<T> {
  data: T[]
  totalRegistros: number
  totalPaginas: number
  numeroPagina: number
  paginasRestantes: number
  empty: boolean
}

export interface PncpItem {
  numeroItem: number
  descricao: string | null
  materialOuServico: "M" | "S" | string
  materialOuServicoNome: string | null
  valorUnitarioEstimado: number | null
  valorTotal: number | null
  quantidade: number | null
  unidadeMedida: string | null
  criterioJulgamentoId: number | null
  criterioJulgamentoNome: string | null
  situacaoCompraItemId: number | null
  situacaoCompraItemNome: string | null
  categoriaId: number | null
  categoriaNome: string | null
}

export interface PncpArquivo {
  sequencialDocumento: number
  titulo: string | null
  tipoDocumentoNome: string | null
  dataPublicacaoPncp: string | null
  url: string
  uri: string
  statusAtivo: boolean
}

export interface PncpHistorico {
  tipoLogManutencaoNome: string
  categoriaLogManutencaoNome: string
  logManutencaoDataInclusao: string
  justificativa: string | null
  usuarioNome: string | null
  itemNumero: number | null
  documentoTitulo: string | null
}

export interface PncpModalidade {
  id: number
  nome: string
  descricao: string
  statusAtivo: boolean
}

// ─── Tipos de filtro/URL ─────────────────────────────────────────────────── //

export interface BuscaFiltros {
  pagina: number
  uf?: string
  modalidade?: number
  q?: string
}
