/**
 * GET /api/cron/alertas
 * Detecta novas contratações que batem com pesquisas salvas e registra em alertas_enviados.
 * Protegido por CRON_SECRET no header Authorization: Bearer <secret>.
 *
 * Agendamento sugerido: diário (GitHub Actions cron ou cron-job.org).
 * Obs: envio de e-mail (Resend) fica em TODO — instalar `resend` e configurar RESEND_API_KEY.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import {
  contratacoes, orgaos, unidadesOrgao, modalidades,
  pesquisasSalvas, alertasEnviados,
} from "@/db/schema"
import {
  eq, and, gte, isNotNull, inArray,
} from "drizzle-orm"

function checarAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

interface FiltrosPesquisa {
  q?: string
  uf?: string
  modalidade?: number
}

export async function GET(req: NextRequest) {
  if (!checarAuth(req)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  // Janela de busca: contratações coletadas nas últimas 25h (margem para crons diários)
  const desde = new Date(Date.now() - 25 * 60 * 60 * 1_000)

  // 1. Busca todas as pesquisas ativas
  const pesquisas = await db
    .select()
    .from(pesquisasSalvas)
    .where(eq(pesquisasSalvas.ativa, true))

  if (pesquisas.length === 0) {
    return NextResponse.json({ processadas: 0, matches: 0 })
  }

  // 2. Carrega contratações novas (com joins para filtro de UF e modalidade)
  const novas = await db
    .select({
      id:          contratacoes.id,
      objeto:      contratacoes.objeto,
      orgaoNome:   orgaos.razaoSocial,
      uf:          unidadesOrgao.ufSigla,
      modalidadeId: contratacoes.modalidadeId,
      modalidadeNome: modalidades.nome,
      valorEstimado: contratacoes.valorEstimado,
      numeroControlePncp: contratacoes.numeroControlePncp,
      dataEncerramentoProposta: contratacoes.dataEncerramentoProposta,
    })
    .from(contratacoes)
    .innerJoin(orgaos,        eq(contratacoes.orgaoId,        orgaos.id))
    .leftJoin(unidadesOrgao,  eq(contratacoes.unidadeOrgaoId, unidadesOrgao.id))
    .leftJoin(modalidades,    eq(contratacoes.modalidadeId,   modalidades.id))
    .where(
      and(
        gte(contratacoes.coletadoEm, desde),
        isNotNull(contratacoes.objeto),
      )
    )
    .limit(500) // limite por execução para não sobrecarregar

  if (novas.length === 0) {
    return NextResponse.json({ processadas: pesquisas.length, matches: 0, novas: 0 })
  }

  let totalMatches = 0
  const registros: { userId: string; eventoId: string; tipo: string }[] = []

  // 3. Para cada pesquisa, filtra as contratações novas
  for (const pesquisa of pesquisas) {
    const f = pesquisa.filtros as FiltrosPesquisa

    const matches = novas.filter((c) => {
      // Filtro de modalidade
      if (f.modalidade && c.modalidadeId !== f.modalidade) return false
      // Filtro de UF
      if (f.uf && c.uf !== f.uf) return false
      // Filtro de texto (case-insensitive no objeto)
      if (f.q) {
        const obj = (c.objeto ?? "").toLowerCase()
        const termos = f.q.toLowerCase().split(/\s+/).filter(Boolean)
        if (!termos.every((t) => obj.includes(t))) return false
      }
      return true
    })

    for (const c of matches) {
      const eventoId = `alerta:${pesquisa.id}:${c.id}`
      registros.push({ userId: pesquisa.userId, eventoId, tipo: "nova_licitacao" })
      totalMatches++
    }
  }

  // 4. Insere com dedup (UNIQUE on userId + eventoId)
  if (registros.length > 0) {
    // Filtra eventos já registrados para não tentar inserir duplicatas
    const eventosIds = registros.map((r) => r.eventoId)
    const jaRegistrados = await db
      .select({ eventoId: alertasEnviados.eventoId })
      .from(alertasEnviados)
      .where(
        and(
          inArray(alertasEnviados.eventoId, eventosIds),
        )
      )

    const jaSet = new Set(jaRegistrados.map((r) => r.eventoId))
    const novos = registros.filter((r) => !jaSet.has(r.eventoId))

    if (novos.length > 0) {
      await db.insert(alertasEnviados).values(
        novos.map((r) => ({
          userId:   r.userId,
          eventoId: r.eventoId,
          tipo:     r.tipo,
        }))
      ).onConflictDoNothing()
    }

    // TODO: agrupar matches por userId e enviar e-mail via Resend
    // Requer: npm install resend + RESEND_API_KEY em .env.local
    // Exemplo:
    //   const resend = new Resend(process.env.RESEND_API_KEY)
    //   await resend.emails.send({ from: 'alertas@licitaradar.com.br', to: usuario.email, ... })
    console.log(`[cron/alertas] ${novos.length} alertas novos registrados de ${registros.length} matches`)
  }

  return NextResponse.json({
    processadas: pesquisas.length,
    novasContratacoes: novas.length,
    matches: totalMatches,
    alertasNovos: registros.length,
    executadoEm: new Date().toISOString(),
  })
}
