import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Buscar ou criar estatísticas gerais do bot
    let botStats = await prisma.botStats.findFirst({
      where: { id: "1" }
    })

    // Se não existir, calcular e criar baseado nos dados existentes
    if (!botStats) {
      const [textCount, audioCount, mediaCount] = await Promise.all([
        prisma.textMessage.count(),
        prisma.audioMessage.count(),
        prisma.mediaMessage.count(),
      ])

      const audioWithTranscription = await prisma.audioMessage.count({
        where: { transcription: { not: null } }
      })

      // Contar leads únicos usando tabela de interações (mais preciso)
      const uniqueLeads = await prisma.interaction.groupBy({
        by: ['sender'],
        where: {
          sender: { not: null }
        }
      })

      const totalMessages = textCount + audioCount + mediaCount
      const leadsAttended = uniqueLeads.length

      // Calcular mensagens por dia (média dos últimos 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentMessages = await Promise.all([
        prisma.textMessage.count({
          where: { receivedAt: { gte: sevenDaysAgo } }
        }),
        prisma.audioMessage.count({
          where: { receivedAt: { gte: sevenDaysAgo } }
        }),
        prisma.mediaMessage.count({
          where: { receivedAt: { gte: sevenDaysAgo } }
        })
      ])
      
      const messagesLast7Days = recentMessages[0] + recentMessages[1] + recentMessages[2]
      const messagesPerDay = Math.round(messagesLast7Days / 7)

      botStats = await prisma.botStats.create({
        data: {
          id: "1",
          totalMessages,
          audioConverted: audioWithTranscription,
          responsesSent: 0, // Começar do zero, será incrementado conforme respostas reais
          leadsAttended,
          messagesPerDay,
          totalMediaMessages: mediaCount,
          averageResponseTime: 1.2,
          uptime: 0.998,
          lastUpdated: new Date()
        }
      })
    }

    // Recalcular leads únicos em tempo real para garantir precisão
    const currentUniqueLeads = await prisma.interaction.groupBy({
      by: ['sender'],
      where: {
        sender: { not: null }
      }
    })

    // Recalcular mensagens por dia em tempo real
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const [recentTextMessages, recentAudioMessages, recentMediaMessages] = await Promise.all([
      prisma.textMessage.count({
        where: { receivedAt: { gte: sevenDaysAgo } }
      }),
      prisma.audioMessage.count({
        where: { receivedAt: { gte: sevenDaysAgo } }
      }),
      prisma.mediaMessage.count({
        where: { receivedAt: { gte: sevenDaysAgo } }
      })
    ])
    
    const totalRecentMessages = recentTextMessages + recentAudioMessages + recentMediaMessages
    const currentMessagesPerDay = Math.round(totalRecentMessages / 7)

    // Atualizar botStats com contagem real
    await prisma.botStats.update({
      where: { id: "1" },
      data: {
        leadsAttended: currentUniqueLeads.length,
        messagesPerDay: currentMessagesPerDay,
        totalMediaMessages: recentMediaMessages,
        lastUpdated: new Date()
      }
    })

    // Buscar stats atualizados
    botStats = await prisma.botStats.findFirst({
      where: { id: "1" }
    })

    // 2. Calcular métricas diárias dos últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date
    }).reverse()

    const dailyMetricsData = await Promise.all(
      last7Days.map(async (date) => {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const [textMessages, audioMessages] = await Promise.all([
          prisma.textMessage.count({
            where: {
              receivedAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          }),
          prisma.audioMessage.count({
            where: {
              receivedAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          })
        ])

        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        
        return {
          day: dayNames[date.getDay()],
          textMessages,
          audioMessages,
          date: date.toISOString().split('T')[0]
        }
      })
    )

    // 3. Buscar interações recentes reais
    const recentInteractions = await prisma.interaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        time: true,
        type: true,
        message: true,
        response: true,
        sender: true
      }
    })

    // 4. Buscar ou criar saúde do sistema
    let systemHealth = await prisma.systemHealth.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!systemHealth) {
      systemHealth = await prisma.systemHealth.create({
        data: {
          status: "Ativo",
          lastExecution: new Date(),
          failuresLast24h: 0,
          performanceScore: 99.8
        }
      })
    }

    // 5. Atualizar system health com dados calculados
    const now = new Date()
    const performanceScore = botStats.uptime * 100

    await prisma.systemHealth.update({
      where: { id: systemHealth.id },
      data: {
        lastExecution: now,
        performanceScore,
        updatedAt: now
      }
    })

    return NextResponse.json({
      botStats: {
        totalMessages: botStats.totalMessages,
        audioConverted: botStats.audioConverted,
        responsesSent: botStats.responsesSent,
        leadsAttended: botStats.leadsAttended,
        messagesPerDay: botStats.messagesPerDay,
        totalMediaMessages: botStats.totalMediaMessages,
        averageResponseTime: botStats.averageResponseTime,
        uptime: botStats.uptime
      },
      dailyMetrics: dailyMetricsData,
      recentInteractions,
      systemHealth: {
        status: systemHealth.status,
        lastExecution: systemHealth.lastExecution,
        failuresLast24h: systemHealth.failuresLast24h,
        performanceScore: systemHealth.performanceScore
      }
    })

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}