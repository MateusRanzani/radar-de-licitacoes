import type { Metadata } from "next"
import { BookmarkCheck } from "lucide-react"
import { EmConstrucao } from "@/app/painel/page"

export const metadata: Metadata = { title: "Acompanhamento" }

export default function AcompanhamentoPage() {
  return <EmConstrucao titulo="Acompanhamento" icon={<BookmarkCheck size={40} />} fase={5} />
}
