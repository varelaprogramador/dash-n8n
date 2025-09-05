import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar estatísticas do bot
export async function GET() {
  try {
    const stats = await prisma.botStats.findFirst({
      orderBy: { lastUpdated: 'desc' }
    })

    if (!stats) {
      // Retornar estatísticas padrão se não houver dados
      return NextResponse.json({
        totalMessages: 0,
        audioConverted: 0,
        responsesSent: 0,
        leadsAttended: 0,
        automationRate: 0.92,
        uptime: 0.998,
        averageResponseTime: 1.2,
        lastUpdated: new Date()
      })
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erro ao buscar estatísticas do bot:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST: Atualizar estatísticas do bot (para o n8n)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      totalMessages,
      audioConverted,
      responsesSent,
      leadsAttended,
      automationRate,
      uptime,
      averageResponseTime
    } = body

    let stats = await prisma.botStats.findFirst({
      orderBy: { lastUpdated: 'desc' }
    })

    if (!stats) {
      // Criar nova entrada
      stats = await prisma.botStats.create({
        data: {
          totalMessages: totalMessages || 0,
          audioConverted: audioConverted || 0,
          responsesSent: responsesSent || 0,
          leadsAttended: leadsAttended || 0,
          automationRate: automationRate || 0.92,
          uptime: uptime || 0.998,
          averageResponseTime: averageResponseTime || 1.2,
          lastUpdated: new Date()
        }
      })
    } else {
      // Atualizar entrada existente
      stats = await prisma.botStats.update({
        where: { id: stats.id },
        data: {
          totalMessages: totalMessages !== undefined ? totalMessages : stats.totalMessages,
          audioConverted: audioConverted !== undefined ? audioConverted : stats.audioConverted,
          responsesSent: responsesSent !== undefined ? responsesSent : stats.responsesSent,
          leadsAttended: leadsAttended !== undefined ? leadsAttended : stats.leadsAttended,
          automationRate: automationRate !== undefined ? automationRate : stats.automationRate,
          uptime: uptime !== undefined ? uptime : stats.uptime,
          averageResponseTime: averageResponseTime !== undefined ? averageResponseTime : stats.averageResponseTime,
          lastUpdated: new Date()
        }
      })
    }

    return NextResponse.json(
      { message: 'Estatísticas atualizadas com sucesso', stats },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT: Incrementar contadores específicos (para o n8n)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      incrementMessages = 0,
      incrementAudio = 0,
      incrementResponses = 0,
      incrementLeads = 0
    } = body

    let stats = await prisma.botStats.findFirst({
      orderBy: { lastUpdated: 'desc' }
    })

    if (!stats) {
      // Criar nova entrada se não existir
      stats = await prisma.botStats.create({
        data: {
          totalMessages: incrementMessages,
          audioConverted: incrementAudio,
          responsesSent: incrementResponses,
          leadsAttended: incrementLeads,
          lastUpdated: new Date()
        }
      })
    } else {
      // Incrementar valores existentes
      stats = await prisma.botStats.update({
        where: { id: stats.id },
        data: {
          totalMessages: stats.totalMessages + incrementMessages,
          audioConverted: stats.audioConverted + incrementAudio,
          responsesSent: stats.responsesSent + incrementResponses,
          leadsAttended: stats.leadsAttended + incrementLeads,
          lastUpdated: new Date()
        }
      })
    }

    return NextResponse.json(
      { message: 'Contadores incrementados com sucesso', stats },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao incrementar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}