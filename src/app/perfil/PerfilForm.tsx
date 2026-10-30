"use client"

import { useActionState } from "react"
import { salvarPerfilOrgao, type PerfilState } from "@/app/actions/perfil"
import { CheckCircle, AlertCircle } from "lucide-react"

interface Props {
  nome: string
  email: string
  cnpjOrgao: string
  nomeOrgao: string
  codigoIbgeMunicipio: string
}

const estado0: PerfilState = { ok: false }

export function PerfilForm({ nome, email, cnpjOrgao, nomeOrgao, codigoIbgeMunicipio }: Props) {
  const [state, action, pending] = useActionState(salvarPerfilOrgao, estado0)

  return (
    <form action={action} className="space-y-6">
      {/* Conta */}
      <section
        className="rounded-2xl border bg-white p-5 space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>Conta</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Nome" valor={nome} readOnly />
          <Campo label="E-mail" valor={email} readOnly />
        </div>
      </section>

      {/* Órgão */}
      <section
        className="rounded-2xl border bg-white p-5 space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>Órgão / Município</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Usado para exibir contratos vencendo e dados personalizados no painel.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--navy)" }}>
            CNPJ do Órgão
          </label>
          <input
            name="cnpj_orgao"
            type="text"
            defaultValue={cnpjOrgao}
            placeholder="00.000.000/0001-00"
            maxLength={18}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            style={{
              borderColor: "var(--border)",
              color: "var(--navy)",
            }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            14 dígitos, com ou sem formatação. Encontre no portal PNCP ou CNPJ.ws.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--navy)" }}>
            Nome do Órgão (opcional)
          </label>
          <input
            name="nome_orgao"
            type="text"
            defaultValue={nomeOrgao}
            placeholder="Ex.: Prefeitura Municipal de..."
            maxLength={200}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--navy)" }}>
            Código IBGE do Município (opcional)
          </label>
          <input
            name="codigo_ibge_municipio"
            type="text"
            defaultValue={codigoIbgeMunicipio}
            placeholder="7 dígitos, ex.: 3550308"
            maxLength={7}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}
          />
        </div>
      </section>

      {state.erro && (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#FCA5A5", background: "#FEF2F2", color: "#991B1B" }}
        >
          <AlertCircle size={16} />
          {state.erro}
        </div>
      )}

      {state.ok && (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#86EFAC", background: "#F0FDF4", color: "#166534" }}
        >
          <CheckCircle size={16} />
          Perfil salvo com sucesso.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 px-6 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        style={{ background: "var(--brand)", color: "var(--navy)" }}
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  )
}

function Campo({ label, valor, readOnly }: { label: string; valor: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--navy)" }}>{label}</label>
      <input
        type="text"
        value={valor}
        readOnly={readOnly}
        className="w-full rounded-xl border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--border)",
          color: readOnly ? "var(--text-muted)" : "var(--navy)",
          background: readOnly ? "var(--canvas)" : "white",
        }}
      />
    </div>
  )
}
