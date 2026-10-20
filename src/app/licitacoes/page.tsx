import { Suspense } from "react"
import type { Metadata } from "next"
import { listarPropostas, listarModalidades } from "@/lib/pncp"
import { CardLicitacao } from "@/components/licitacoes/CardLicitacao"
import { FiltrosClient } from "@/components/licitacoes/FiltrosClient"
import { PaginacaoClient } from "@/components/licitacoes/PaginacaoClient"
import { CenteredSpinner } from "@/components/ui/Spinner"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Buscar Licitações",
  description: "Pesquise licitações públicas abertas do PNCP com filtros por estado e modalidade.",
}

// searchParams torna a página dinâmica (SSR por requisição)
export default async function LicitacoesPage(props: PageProps<"/licitacoes">) {
  const sp = await props.searchParams

  const pagina     = Math.max(1, parseInt(String(sp.pagina ?? "1"), 10) || 1)
  const uf         = typeof sp.uf === "string" && sp.uf ? sp.uf : undefined
  const modalidade = sp.modalidade ? parseInt(String(sp.modalidade), 10) : undefined
  const vizualizacao = sp.visualizacao === "compacto" ? "compacto" : "lista"

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 w-full">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>
          Licitações com proposta em aberto
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Fonte: PNCP · consulta ao vivo · página {pagina}
        </p>
      </div>

      {/* Conteúdo suspense-streamed */}
      <Suspense fallback={<CenteredSpinner />}>
        <LicitacoesConteudo
          pagina={pagina}
          uf={uf}
          modalidade={modalidade}
          visualizacao={vizualizacao}
        />
      </Suspense>
    </div>
  )
}

async function LicitacoesConteudo({
  pagina, uf, modalidade, visualizacao,
}: {
  pagina: number
  uf?: string
  modalidade?: number
  visualizacao: "lista" | "compacto"
}) {
  // Busca em paralelo: lista + modalidades (para os filtros)
  const [resultado, modalidades] = await Promise.all([
    listarPropostas({ pagina, uf, modalidade, tamanhoPagina: 20 }).catch((err) => ({
      error: err instanceof Error ? err.message : String(err),
    })),
    listarModalidades().catch(() => [] as Awaited<ReturnType<typeof listarModalidades>>),
  ])

  // Erro da API
  if ("error" in resultado) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border p-8 text-center"
        style={{ borderColor: "var(--danger)", background: "rgb(240 68 56 / 0.04)" }}
        role="alert"
      >
        <AlertTriangle size={28} style={{ color: "var(--danger)" }} />
        <p className="font-medium" style={{ color: "var(--danger)" }}>Não foi possível conectar ao PNCP</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{resultado.error}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-light)" }}>
          O PNCP pode estar temporariamente indisponível. Tente novamente em instantes.
        </p>
      </div>
    )
  }

  // Lista vazia
  if (resultado.empty || resultado.data.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border p-8 text-center"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="font-medium" style={{ color: "var(--navy)" }}>Nenhuma licitação encontrada</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Tente remover os filtros ou alterar os critérios de busca.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Barra de filtros (client island) */}
      <div className="mb-4">
        <FiltrosClient
          modalidades={modalidades}
          totalRegistros={resultado.totalRegistros}
          visualizacao={visualizacao}
        />
      </div>

      {/* Lista de resultados */}
      <div className={visualizacao === "compacto" ? "flex flex-col gap-1" : "flex flex-col gap-3"}>
        {resultado.data.map((licitacao) => (
          <CardLicitacao
            key={licitacao.numeroControlePNCP}
            licitacao={licitacao}
            compacto={visualizacao === "compacto"}
          />
        ))}
      </div>

      {/* Paginação (client island) */}
      <PaginacaoClient
        paginaAtual={resultado.numeroPagina}
        totalPaginas={resultado.totalPaginas}
      />

      {/* Rodapé de transparência */}
      <p className="text-center text-[11px] pb-4" style={{ color: "var(--text-light)" }}>
        {resultado.totalRegistros.toLocaleString("pt-BR")} licitações com proposta em aberto no PNCP ·
        Consulta ao vivo · dados não armazenados nesta etapa ·{" "}
        <a
          href="https://pncp.gov.br"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--brand-ink)" }}
          className="hover:underline"
        >
          Portal original ↗
        </a>
      </p>
    </>
  )
}
