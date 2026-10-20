import type { Metadata } from "next"
import { Settings } from "lucide-react"
import { EmConstrucao } from "@/app/painel/page"

export const metadata: Metadata = { title: "Admin" }

export default function AdminPage() {
  return <EmConstrucao titulo="Admin" icon={<Settings size={40} />} fase={2} />
}
