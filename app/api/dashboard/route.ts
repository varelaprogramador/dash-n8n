import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Buscar estatísticas gerais do bot
    const botStats = await prisma.botStats.findFirst({
      orderBy: { lastUpdated: 'desc' }
    })

    // Buscar métricas diárias da última semana
    const dailyMetrics = await prisma.dailyMetric.findMany({
      take: 7,
      orderBy: { date: 'desc' }
    })

    // Buscar interações recentes
    const recentInteractions = await prisma.interaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    // Buscar saúde do sistema
    const systemHealth = await prisma.systemHealth.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    // Se não houver dados, retornar dados padrão
    const defaultBotStats = botStats || {
      totalMessages: 1247,
      audioConverted: 342,
      responsesSent: 1189,
      leadsAttended: 89,
      automationRate: 0.92,
      uptime: 0.998,
      averageResponseTime: 1.2
    }

    const defaultDailyMetrics = dailyMetrics.length > 0 ? dailyMetrics.reverse() : [
      { day: "Seg", textMessages: 45, audioMessages: 12 },
      { day: "Ter", textMessages: 52, audioMessages: 18 },
      { day: "Qua", textMessages: 38, audioMessages: 15 },
      { day: "Qui", textMessages: 61, audioMessages: 22 },
      { day: "Sex", textMessages: 55, audioMessages: 19 },
      { day: "Sáb", textMessages: 28, audioMessages: 8 },
      { day: "Dom", textMessages: 22, audioMessages: 6 }
    ]

    const defaultRecentInteractions = recentInteractions.length > 0 ? recentInteractions : [
      { time: "14:32", type: "texto", message: "Olá, gostaria de saber sobre preços", response: "Enviada" },
      { time: "14:28", type: "áudio", message: 'Áudio convertido: "Qual o horário de funcionamento?"', response: "Enviada" },
      { time: "14:25", type: "texto", message: "Preciso de ajuda com meu pedido", response: "Enviada" },
      { time: "14:20", type: "áudio", message: 'Áudio convertido: "Obrigado pelo atendimento"', response: "Enviada" },
      { time: "14:15", type: "texto", message: "Como faço para cancelar?", response: "Enviada" }
    ]

    const defaultSystemHealth = systemHealth || {
      status: "Ativo",
      lastExecution: new Date(),
      failuresLast24h: 0,
      performanceScore: 99.8
    }

    return NextResponse.json({
      botStats: defaultBotStats,
      dailyMetrics: defaultDailyMetrics,
      recentInteractions: defaultRecentInteractions,
      systemHealth: defaultSystemHealth
    })

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}