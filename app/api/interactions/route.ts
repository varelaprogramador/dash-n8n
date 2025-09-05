import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar interações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const interactions = await prisma.interaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ interactions })

  } catch (error) {
    console.error('Erro ao buscar interações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST: Criar nova interação (para o n8n)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { time, type, message, response, status = "Enviada" } = body

    // Validação básica
    if (!time || !type || !message || !response) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: time, type, message, response' },
        { status: 400 }
      )
    }

    if (!['texto', 'áudio'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "texto" ou "áudio"' },
        { status: 400 }
      )
    }

    const interaction = await prisma.interaction.create({
      data: {
        time,
        type,
        message,
        response,
        status
      }
    })

    // Atualizar estatísticas gerais
    await updateBotStats(type)

    return NextResponse.json(
      { message: 'Interação criada com sucesso', interaction },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro ao criar interação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para atualizar estatísticas
async function updateBotStats(type: string) {
  try {
    let stats = await prisma.botStats.findFirst({
      orderBy: { lastUpdated: 'desc' }
    })

    if (!stats) {
      // Criar estatísticas iniciais
      stats = await prisma.botStats.create({
        data: {
          totalMessages: 1,
          audioConverted: type === 'áudio' ? 1 : 0,
          responsesSent: 1,
          leadsAttended: 1
        }
      })
    } else {
      // Atualizar estatísticas existentes
      await prisma.botStats.update({
        where: { id: stats.id },
        data: {
          totalMessages: stats.totalMessages + 1,
          audioConverted: type === 'áudio' ? stats.audioConverted + 1 : stats.audioConverted,
          responsesSent: stats.responsesSent + 1,
          lastUpdated: new Date()
        }
      })
    }

    // Atualizar métricas diárias
    await updateDailyMetrics(type)

  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error)
  }
}

// Função auxiliar para atualizar métricas diárias
async function updateDailyMetrics(type: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const dayName = dayNames[today.getDay()]

    let dailyMetric = await prisma.dailyMetric.findUnique({
      where: { date: today }
    })

    if (!dailyMetric) {
      // Criar métrica do dia
      dailyMetric = await prisma.dailyMetric.create({
        data: {
          date: today,
          day: dayName,
          textMessages: type === 'texto' ? 1 : 0,
          audioMessages: type === 'áudio' ? 1 : 0,
          totalMessages: 1
        }
      })
    } else {
      // Atualizar métrica existente
      await prisma.dailyMetric.update({
        where: { id: dailyMetric.id },
        data: {
          textMessages: type === 'texto' ? dailyMetric.textMessages + 1 : dailyMetric.textMessages,
          audioMessages: type === 'áudio' ? dailyMetric.audioMessages + 1 : dailyMetric.audioMessages,
          totalMessages: dailyMetric.totalMessages + 1,
          updatedAt: new Date()
        }
      })
    }

  } catch (error) {
    console.error('Erro ao atualizar métricas diárias:', error)
  }
}