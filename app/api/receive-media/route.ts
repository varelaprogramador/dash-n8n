import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sender,
      mediaBase64,
      mediaType,
      mimeType,
      fileName,
      fileSize,
      timestamp,
      messageId,
      caption,
    } = body;

    // Validações obrigatórias
    if (!sender || !mediaBase64 || !mediaType) {
      return NextResponse.json(
        {
          error: "Remetente, mídia em base64 e tipo de mídia são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Validar tipos de mídia aceitos
    const allowedTypes = ["image", "document", "video", "sticker"];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json(
        {
          error:
            "Tipo de mídia não suportado. Use: image, document, video, sticker",
        },
        { status: 400 }
      );
    }

    // Validar formato base64
    const base64Regex = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,/;
    if (!base64Regex.test(mediaBase64)) {
      return NextResponse.json(
        {
          error: "Formato base64 inválido. Use: data:[mimeType];base64,[dados]",
        },
        { status: 400 }
      );
    }

    // Extrair informações do base64
    const base64Match = mediaBase64.match(base64Regex);
    const detectedMimeType = base64Match ? base64Match[1] : mimeType;
    const base64Data = mediaBase64.split(",")[1];

    // Calcular tamanho aproximado do arquivo (base64 é ~33% maior que o original)
    const approximateSize = fileSize || Math.floor((base64Data.length * 3) / 4);

    // Validar tamanho máximo (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (approximateSize > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 50MB" },
        { status: 400 }
      );
    }

    // Salvar no banco de dados
    const mediaMessage = await prisma.mediaMessage.create({
      data: {
        sender,
        mediaBase64,
        mediaType,
        mimeType: detectedMimeType,
        fileName: fileName || `${mediaType}_${Date.now()}`,
        fileSize: approximateSize,
        caption: caption || null,
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

    // Definir emoji do tipo de mídia
    const mediaEmojis = {
      image: "🖼️",
      document: "📄",
      video: "🎥",
      sticker: "😄",
    };

    // Adicionar à lista de interações recentes
    await prisma.interaction.create({
      data: {
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: mediaType,
        message: `${mediaEmojis[mediaType as keyof typeof mediaEmojis]} ${
          fileName || "Mídia"
        } ${caption ? `- ${caption}` : ""}`,
        response: "Recebida",
        sender,
        createdAt: new Date(),
      },
    });

    // Verificar se é um novo lead (primeiro contato)
    const existingMessages = await prisma.mediaMessage.count({
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
      message: "Mídia salva com sucesso",
      data: {
        id: mediaMessage.id,
        sender,
        mediaType,
        fileName: mediaMessage.fileName,
        fileSize: approximateSize,
        receivedAt: mediaMessage.receivedAt,
        isNewLead: existingMessages === 1,
        hasCaption: !!caption,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar mídia:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
