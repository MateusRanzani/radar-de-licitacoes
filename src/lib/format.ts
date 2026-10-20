// Utilitários de formatação para pt-BR

const LOCALE = "pt-BR"
const TZ     = "America/Sao_Paulo"

// ─── Dinheiro ────────────────────────────────────────────────────────────── //

const fmtMoeda = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL" })
const fmtNum   = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor == null) return "Não informado"
  return fmtMoeda.format(valor)
}

export function formatarNumero(n: number): string {
  return fmtNum.format(n)
}

// ─── Datas ───────────────────────────────────────────────────────────────── //
// As datas do PNCP vêm SEM fuso (ex: "2026-10-19T00:01:02").
// Tratamos como America/Sao_Paulo — documentado.

const fmtData      = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
const fmtDataHora  = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
const fmtHora      = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: "2-digit", minute: "2-digit" })

/** "2026-10-19T00:01:02" → Date interpretada como Brasília */
export function parsePncpDate(s: string | null | undefined): Date | null {
  if (!s) return null
  // "2026-10-19T00:01:02" — sem fuso, tratamos como -03:00
  const cleaned = s.endsWith("Z") || s.includes("+") ? s : `${s}-03:00`
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

export function formatarData(s: string | null | undefined): string {
  const d = parsePncpDate(s)
  if (!d) return "Não informado"
  return fmtData.format(d)
}

export function formatarDataHora(s: string | null | undefined): string {
  const d = parsePncpDate(s)
  if (!d) return "Não informado"
  return fmtDataHora.format(d)
}

/** "há X dias" / "em X dias" relativo a agora */
export function formatarRelativo(s: string | null | undefined): string {
  const d = parsePncpDate(s)
  if (!d) return "Não informado"
  const diffMs  = d.getTime() - Date.now()
  const diffDia = Math.round(diffMs / 86_400_000)
  if (diffDia === 0) return `hoje às ${fmtHora.format(d)}`
  if (diffDia === 1) return "amanhã"
  if (diffDia === -1) return "ontem"
  if (diffDia > 0) return `em ${diffDia} dias`
  return `há ${Math.abs(diffDia)} dias`
}

/** Retorna true se a data de encerramento é futura (proposta ainda aceita segundo a data da consulta) */
export function estaAberta(dataEncerramento: string | null | undefined): boolean {
  const d = parsePncpDate(dataEncerramento)
  if (!d) return false
  return d.getTime() > Date.now()
}

// ─── Esfera ──────────────────────────────────────────────────────────────── //

export function formatarEsfera(esferaId: string | null): string {
  switch (esferaId) {
    case "F": return "Federal"
    case "E": return "Estadual"
    case "M": return "Municipal"
    case "D": return "Distrital"
    default:  return esferaId ?? "Não informado"
  }
}

// ─── Texto truncado ──────────────────────────────────────────────────────── //

export function truncar(texto: string | null | undefined, max = 160): string {
  if (!texto) return "Não informado"
  if (texto.length <= max) return texto
  return texto.slice(0, max).trimEnd() + "…"
}

/** Dias restantes até a data (negativo = já passou). null se data inválida. */
export function diasRestantes(s: string | null | undefined): number | null {
  const d = parsePncpDate(s)
  if (!d) return null
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

// ─── Plural simples ──────────────────────────────────────────────────────── //

export function plural(n: number, singular: string, pluralStr?: string): string {
  return `${formatarNumero(n)} ${n === 1 ? singular : (pluralStr ?? singular + "s")}`
}
