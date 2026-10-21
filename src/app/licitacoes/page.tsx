import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { connection } from "next/server"
import { listarPropostas, listarModalidades } from "@/lib/pncp"
import { CardLicitacao } from "@/components/licitacoes/CardLicitacao"
import { FiltrosClient } from "@/components/licitacoes/FiltrosClient"
import { PaginacaoClient } from "@/components/licitacoes/PaginacaoClient"
import { BuscaPncpClient } from "@/components/licitacoes/BuscaPncpClient"
import { CenteredSpinner } from "@/components/ui/Spinner"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Buscar Licitações",
  description: "Encontre editais recebendo proposta no PNCP por palavra, estado, esfera e modalidade.",
}

export default async function LicitacoesPage(props: PageProps<"/licitacoes">) {
  const sp = await props.searchParams
  const modoLista = sp.modo === "lista"

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>
          {modoLista ? "Lista ao vivo (sem busca por palavra)" : "Encontre licitações para o seu negócio"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {modoLista ? (
            <>Plano B quando a busca do PNCP não responde · <Link href="/licitacoes" className="hover:underline" style={{ color: "var(--brand-ink)" }}>voltar para a busca</Link></>
          ) : (
            "Editais recebendo proposta em todo o Brasil, direto do PNCP."
          )}
        </p>
      </div>

      <Suspense fallback={<CenteredSpinner />}>
        {modoLista ? (
          <ListaAoVivo
            pagina={Math.max(1, parseInt(String(sp.pagina ?? "1"), 10) || 1)}
            uf={typeof sp.uf === "string" && sp.uf ? sp.uf : undefined}
            modalidade={sp.modalidade ? parseInt(String(sp.modalidade), 10) : undefined}
            visualizacao={sp.visualizacao === "compacto" ? "compacto" : "lista"}
          />
        ) : (
          <Busca />
        )}
      </Suspense>
    </div>
  )
}

async function Busca() {
  const modalidades = await listarModalidades().catch(() => [])
  return <BuscaPncpClient modalidades={modalidades} />
}

async function ListaAoVivo({
  pagina, uf, modalidade, visualizacao,
}: {
  pagina: number; uf?: string; modalidade?: number; visualizacao: "lista" | "compacto"
}) {
  await connection()

  const [resultado, modalidades] = await Promise.all([
    listarPropostas({ pagina, uf, modalidade, tamanhoPagina: 20 }).catch((err) => ({
      error: err instanceof Error ? err.message : String(err),
    })),
    listarModalidades().catch(() => []),
  ])

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
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        <FiltrosClient modalidades={modalidades} totalRegistros={resultado.totalRegistros} visualizacao={visualizacao} />
      </div>

      {resultado.data.length === 0 ? (
        <p className="rounded-2xl border p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          Nenhuma licitação encontrada. Tente remover os filtros.
        </p>
      ) : (
        <div className={visualizacao === "compacto" ? "flex flex-col gap-1" : "flex flex-col gap-3"}>
          {resultado.data.map((l) => (
            <CardLicitacao key={l.numeroControlePNCP} licitacao={l} compacto={visualizacao === "compacto"} />
          ))}
        </div>
      )}

      <PaginacaoClient paginaAtual={resultado.numeroPagina} totalPaginas={resultado.totalPaginas} />
    </>
  )
}
