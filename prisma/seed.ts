import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpar dados existentes
  await prisma.interaction.deleteMany()
  await prisma.dailyMetric.deleteMany()
  await prisma.botStats.deleteMany()
  await prisma.systemHealth.deleteMany()

  // Criar estatísticas do bot
  await prisma.botStats.create({
    data: {
      totalMessages: 1247,
      audioConverted: 342,
      responsesSent: 1189,
      leadsAttended: 89,
      automationRate: 0.92,
      uptime: 0.998,
      averageResponseTime: 1.2,
    }
  })

  // Criar métricas diárias
  const daysOfWeek = [
    { day: "Seg", textMessages: 45, audioMessages: 12 },
    { day: "Ter", textMessages: 52, audioMessages: 18 },
    { day: "Qua", textMessages: 38, audioMessages: 15 },
    { day: "Qui", textMessages: 61, audioMessages: 22 },
    { day: "Sex", textMessages: 55, audioMessages: 19 },
    { day: "Sáb", textMessages: 28, audioMessages: 8 },
    { day: "Dom", textMessages: 22, audioMessages: 6 }
  ]

  for (let i = 0; i < daysOfWeek.length; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i)) // últimos 7 dias
    date.setHours(0, 0, 0, 0)
    
    await prisma.dailyMetric.create({
      data: {
        date: date,
        day: daysOfWeek[i].day,
        textMessages: daysOfWeek[i].textMessages,
        audioMessages: daysOfWeek[i].audioMessages,
        totalMessages: daysOfWeek[i].textMessages + daysOfWeek[i].audioMessages
      }
    })
  }

  // Criar interações recentes
  const interactions = [
    { time: "14:32", type: "texto", message: "Olá, gostaria de saber sobre preços", response: "Enviada" },
    { time: "14:28", type: "áudio", message: 'Áudio convertido: "Qual o horário de funcionamento?"', response: "Enviada" },
    { time: "14:25", type: "texto", message: "Preciso de ajuda com meu pedido", response: "Enviada" },
    { time: "14:20", type: "áudio", message: 'Áudio convertido: "Obrigado pelo atendimento"', response: "Enviada" },
    { time: "14:15", type: "texto", message: "Como faço para cancelar?", response: "Enviada" }
  ]

  for (const interaction of interactions) {
    await prisma.interaction.create({
      data: interaction
    })
  }

  // Criar saúde do sistema
  await prisma.systemHealth.create({
    data: {
      status: "Ativo",
      lastExecution: new Date(),
      failuresLast24h: 0,
      performanceScore: 99.8
    }
  })

  console.log('✅ Banco de dados populado com dados de exemplo!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })