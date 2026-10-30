"use client"

import { useActionState, useTransition } from "react"
import { salvarPesquisa, deletarPesquisa, togglePesquisa } from "@/app/actions/pesquisas"
import type { PesquisaState } from "@/app/actions/pesquisas"
import { Search, Plus, Trash2, Bell, BellOff, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { UFS } from "@/lib/constants"

interface PesquisaSalva {
  id: bigint
  nome: string
  filtros: Record<string, unknown>
  frequencia: string | null
  ativa: boolean | null
  ultimaExecucao: Date | null
  criadoEm: Date
}

const MODALIDADES_COMUNS = [
  { id: 6,  nome: "Pregão Eletrônico" },
  { id: 8,  nome: "Dispensa de Licitação" },
  { id: 9,  nome: "Inexigibilidade" },
  { id: 4,  nome: "Concorrência Eletrônica" },
]

const FREQUENCIAS = [
  { value: "diaria",   label: "Diária" },
  { value: "semanal",  label: "Semanal" },
]

const INICIAL: PesquisaState = { ok: false }

export function PesquisasSalvas({ pesquisas }: { pesquisas: PesquisaSalva[] }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [state, action, pending] = useActionState(salvarPesquisa, INICIAL)
  const [, startTransition] = useTransition()

  function handleDelete(id: bigint) {
    startTransition(() => { void deletarPesquisa(id) })
  }

  function handleToggle(id: bigint, ativa: boolean) {
    startTransition(() => { void togglePesquisa(id, ativa) })
  }

  return (
    <section className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search size={15} style={{ color: "var(--brand)" }} />
          <h2 className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
            Pesquisas salvas com alerta
          </h2>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "var(--brand)", color: "var(--navy)" }}
        >
          <Plus size={12} />
          Nova pesquisa
          {mostrarForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form
          action={action}
          className="mb-4 rounded-xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--navy)" }}>
                Nome da pesquisa *
              </label>
              <input
                name="nome"
                required
                placeholder="Ex: TI em SP"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1"
                style={{ borderColor: "var(--border)", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--navy)" }}>
                Palavra-chave no objeto
              </label>
              <input
                name="q"
                placeholder="Ex: desenvolvimento de software"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1"
                style={{ borderColor: "var(--border)", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--navy)" }}>
                UF
              </label>
              <select
                name="uf"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1"
                style={{ borderColor: "var(--border)", background: "#fff" }}
              >
                <option value="">Todas</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--navy)" }}>
                Modalidade
              </label>
              <select
                name="modalidade"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1"
                style={{ borderColor: "var(--border)", background: "#fff" }}
              >
                <option value="">Qualquer</option>
                {MODALIDADES_COMUNS.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--navy)" }}>
                Frequência do alerta
              </label>
              <select
                name="frequencia"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1"
                style={{ borderColor: "var(--border)", background: "#fff" }}
              >
                {FREQUENCIAS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {state.erro && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgb(220 38 38 / 0.08)", color: "#B91C1C" }}>
              {state.erro}
            </p>
          )}
          {state.ok && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgb(34 197 94 / 0.08)", color: "#15803D" }}>
              Pesquisa salva com sucesso.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: "var(--navy)", color: "#fff" }}
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {pesquisas.length === 0 && !mostrarForm && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhuma pesquisa salva. Crie uma para receber alertas de novas licitações.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {pesquisas.map((p) => {
          const filtros = p.filtros as { q?: string; uf?: string; modalidade?: number }
          const chips = [
            filtros.q && `"${filtros.q}"`,
            filtros.uf && `UF: ${filtros.uf}`,
            filtros.modalidade && `Modal. ${filtros.modalidade}`,
          ].filter(Boolean) as string[]

          return (
            <div
              key={String(p.id)}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: p.ativa ? "var(--border)" : "var(--border)",
                opacity: p.ativa ? 1 : 0.5,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: "var(--navy)" }}>
                  {p.nome}
                </p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {chips.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgb(255 90 31 / 0.10)", color: "#C2410C" }}
                    >
                      {c}
                    </span>
                  ))}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {p.frequencia ?? "diária"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(p.id, !p.ativa)}
                  title={p.ativa ? "Pausar alerta" : "Ativar alerta"}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                >
                  {p.ativa
                    ? <Bell size={14} style={{ color: "var(--brand)" }} />
                    : <BellOff size={14} style={{ color: "var(--text-muted)" }} />
                  }
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  title="Remover"
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} style={{ color: "#B91C1C" }} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
