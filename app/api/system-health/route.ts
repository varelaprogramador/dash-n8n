import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar saúde do sistema
export async function GET() {
  try {
    const health = await prisma.systemHealth.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!health) {
      // Retornar dados padrão se não houver dados
      return NextResponse.json({
        status: "Ativo",
        lastExecution: new Date(),
        failuresLast24h: 0,
        performanceScore: 99.8,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json(health)

  } catch (error) {
    console.error('Erro ao buscar saúde do sistema:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST: Atualizar saúde do sistema (para o n8n)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      status,
      failuresLast24h,
      performanceScore
    } = body

    let health = await prisma.systemHealth.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!health) {
      // Criar nova entrada
      health = await prisma.systemHealth.create({
        data: {
          status: status || "Ativo",
          lastExecution: new Date(),
          failuresLast24h: failuresLast24h || 0,
          performanceScore: performanceScore || 99.8
        }
      })
    } else {
      // Atualizar entrada existente
      health = await prisma.systemHealth.update({
        where: { id: health.id },
        data: {
          status: status !== undefined ? status : health.status,
          lastExecution: new Date(),
          failuresLast24h: failuresLast24h !== undefined ? failuresLast24h : health.failuresLast24h,
          performanceScore: performanceScore !== undefined ? performanceScore : health.performanceScore,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json(
      { message: 'Saúde do sistema atualizada com sucesso', health },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao atualizar saúde do sistema:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT: Registrar execução bem-sucedida (para o n8n)
export async function PUT() {
  try {
    let health = await prisma.systemHealth.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!health) {
      // Criar nova entrada
      health = await prisma.systemHealth.create({
        data: {
          status: "Ativo",
          lastExecution: new Date(),
          failuresLast24h: 0,
          performanceScore: 99.8
        }
      })
    } else {
      // Atualizar última execução
      health = await prisma.systemHealth.update({
        where: { id: health.id },
        data: {
          status: "Ativo",
          lastExecution: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json(
      { message: 'Execução registrada com sucesso', health },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao registrar execução:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH: Registrar falha (para o n8n)
export async function PATCH() {
  try {
    let health = await prisma.systemHealth.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!health) {
      // Criar nova entrada com falha
      health = await prisma.systemHealth.create({
        data: {
          status: "Com Falhas",
          lastExecution: new Date(),
          failuresLast24h: 1,
          performanceScore: 95.0
        }
      })
    } else {
      // Incrementar falhas
      const newFailureCount = health.failuresLast24h + 1
      const newPerformanceScore = Math.max(90.0, health.performanceScore - 1.0)
      
      health = await prisma.systemHealth.update({
        where: { id: health.id },
        data: {
          status: newFailureCount > 5 ? "Crítico" : "Com Falhas",
          failuresLast24h: newFailureCount,
          performanceScore: newPerformanceScore,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json(
      { message: 'Falha registrada com sucesso', health },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao registrar falha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}