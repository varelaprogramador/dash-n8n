import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sender,
      audioBase64,
      audioMimeType,
      duration,
      timestamp,
      messageId,
      transcription,
    } = body;

    // Validações obrigatórias
    if (!sender || !audioBase64) {
      return NextResponse.json(
        { error: "Remetente e áudio em base64 são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar se o base64 está no formato correto
    if (!audioBase64.match(/^data:audio\/[a-zA-Z]+;base64,/)) {
      return NextResponse.json(
        {
          error:
            "Formato de áudio base64 inválido. Use: data:audio/[tipo];base64,[dados]",
        },
        { status: 400 }
      );
    }

    // Salvar no banco de dados
    const audioMessage = await prisma.audioMessage.create({
      data: {
        sender,
        audioBase64,
        audioMimeType: audioMimeType || "audio/ogg",
        duration: duration || 0,
        transcription: transcription || null,
        messageId: messageId || null,
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
        audioConverted: transcription ? 1 : 0,
        responsesSent: 0,
        leadsAttended: 0,
        automationRate: 0,
        uptime: 1,
        averageResponseTime: 1.2,
        lastUpdated: new Date(),
      },
      update: {
        totalMessages: { increment: 1 },
        audioConverted: transcription ? { increment: 1 } : undefined,
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
        type: "áudio",
        message: transcription || "Mensagem de áudio recebida",
        response: "Recebida",
        sender,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mensagem de áudio salva com sucesso",
      data: {
        id: audioMessage.id,
        sender,
        receivedAt: audioMessage.receivedAt,
        hasTranscription: !!transcription,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar mensagem de áudio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
