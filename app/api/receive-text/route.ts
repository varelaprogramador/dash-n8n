import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sender,
      message,
      timestamp,
      messageId,
      isGroup,
      groupName,
      quotedMessage,
    } = body;

    // Validações obrigatórias
    if (!sender || !message) {
      return NextResponse.json(
        { error: "Remetente e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar tamanho da mensagem
    if (message.length > 4096) {
      return NextResponse.json(
        { error: "Mensagem muito longa. Máximo 4096 caracteres" },
        { status: 400 }
      );
    }

    // Salvar no banco de dados
    const textMessage = await prisma.textMessage.create({
      data: {
        sender,
        message,
        messageId: messageId || null,
        isGroup: isGroup || false,
        groupName: groupName || null,
        quotedMessage: quotedMessage || null,
        receivedAt: timestamp ? new Date(timestamp) : new Date(),
        processed: false,
      },
    });

    // Atualizar estatísticas
    await prisma.botStats.upsert({
      where: { id: "1" },
      create: {
        id: "1",
        totalMessages: 1,
        audioConverted: 0,
        responsesSent: 0,
        leadsAttended: 0,
        automationRate: 0,
        uptime: 1,
        averageResponseTime: 1.2,
        lastUpdated: new Date(),
      },
      update: {
        totalMessages: { increment: 1 },
        lastUpdated: new Date(),
      },
    });

    // Adicionar à lista de interações recentes
    await prisma.interaction.create({
      data: {
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "texto",
        message:
          message.length > 100 ? `${message.substring(0, 100)}...` : message,
        response: "Recebida",
        sender,
        createdAt: new Date(),
      },
    });

    // Verificar se é um novo lead (primeiro contato)
    const existingMessages = await prisma.textMessage.count({
      where: { sender },
    });

    if (existingMessages === 1) {
      // É um novo lead
      await prisma.botStats.update({
        where: { id: "1" },
        data: {
          leadsAttended: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mensagem de texto salva com sucesso",
      data: {
        id: textMessage.id,
        sender,
        receivedAt: textMessage.receivedAt,
        isNewLead: existingMessages === 1,
        messagePreview:
          message.length > 100 ? `${message.substring(0, 100)}...` : message,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar mensagem de texto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
