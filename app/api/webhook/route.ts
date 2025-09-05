import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface N8NMessagePayload {
  // Mensagem de texto
  mensagem?: string;
  
  // Imagem
  "imagem-base64"?: string;
  "imagem-analisada"?: string;
  
  // Documento
  "documento-base64"?: string;
  "documento-conteudo"?: string;
  
  // Áudio
  "audio-transcrito"?: string;
  "audio-base64"?: string;
  
  // Metadados opcionais
  sender?: string;
  messageId?: string;
  timestamp?: string;
  isGroup?: boolean;
  groupName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: N8NMessagePayload = await request.json();
    
    console.log("Webhook recebido:", body);

    // Extrair sender do cabeçalho ou body
    const sender = body.sender || request.headers.get('x-sender') || 'unknown';
    const messageId = body.messageId || `msg_${Date.now()}`;
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    let result;
    let messageType: string;

    // 1. MENSAGEM DE TEXTO
    if (body.mensagem && body.mensagem.trim()) {
      messageType = "texto";
      
      const textMessage = await prisma.textMessage.create({
        data: {
          sender,
          message: body.mensagem,
          messageId,
          isGroup: body.isGroup || false,
          groupName: body.groupName || null,
          receivedAt: timestamp,
          processed: false,
        },
      });

      // Adicionar interação
      await prisma.interaction.create({
        data: {
          time: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "texto",
          message: body.mensagem.length > 100 
            ? `${body.mensagem.substring(0, 100)}...` 
            : body.mensagem,
          response: "Recebida",
          sender,
        },
      });

      result = {
        type: "text",
        id: textMessage.id,
        message: body.mensagem,
      };
    }
    
    // 2. MENSAGEM DE ÁUDIO
    else if (body["audio-base64"] || body["audio-transcrito"]) {
      messageType = "áudio";
      
      // Validar formato base64 se fornecido
      const audioBase64 = body["audio-base64"];
      if (audioBase64 && !audioBase64.match(/^data:audio\/[a-zA-Z0-9]+;base64,/)) {
        return NextResponse.json(
          { error: "Formato de áudio base64 inválido" },
          { status: 400 }
        );
      }

      const audioMessage = await prisma.audioMessage.create({
        data: {
          sender,
          audioBase64: audioBase64 || "",
          audioMimeType: "audio/ogg",
          duration: 0,
          transcription: body["audio-transcrito"] || null,
          messageId,
          receivedAt: timestamp,
          processed: false,
        },
      });

      // Adicionar interação
      await prisma.interaction.create({
        data: {
          time: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "áudio",
          message: body["audio-transcrito"] 
            ? `🎤 ${body["audio-transcrito"]}` 
            : "Mensagem de áudio recebida",
          response: "Recebida",
          sender,
        },
      });

      // Incrementar contador de áudio convertido se há transcrição
      if (body["audio-transcrito"]) {
        await prisma.botStats.upsert({
          where: { id: "1" },
          create: {
            id: "1",
            totalMessages: 1,
            audioConverted: 1,
            responsesSent: 0,
            leadsAttended: 0,
            automationRate: 0,
            uptime: 1,
            averageResponseTime: 1.2,
            lastUpdated: new Date(),
          },
          update: {
            audioConverted: { increment: 1 },
            lastUpdated: new Date(),
          },
        });
      }

      result = {
        type: "audio",
        id: audioMessage.id,
        transcription: body["audio-transcrito"],
        hasAudio: !!audioBase64,
      };
    }
    
    // 3. IMAGEM
    else if (body["imagem-base64"] || body["imagem-analisada"]) {
      messageType = "imagem";
      
      const imageBase64 = body["imagem-base64"];
      if (imageBase64 && !imageBase64.match(/^data:image\/[a-zA-Z0-9]+;base64,/)) {
        return NextResponse.json(
          { error: "Formato de imagem base64 inválido" },
          { status: 400 }
        );
      }

      // Calcular tamanho aproximado
      const base64Data = imageBase64 ? imageBase64.split(",")[1] : "";
      const approximateSize = base64Data ? Math.floor((base64Data.length * 3) / 4) : 0;

      const mediaMessage = await prisma.mediaMessage.create({
        data: {
          sender,
          mediaBase64: imageBase64 || "",
          mediaType: "image",
          mimeType: imageBase64 ? imageBase64.split(";")[0].split(":")[1] : "image/jpeg",
          fileName: `image_${Date.now()}.jpg`,
          fileSize: approximateSize,
          caption: body["imagem-analisada"] || null,
          messageId,
          receivedAt: timestamp,
          processed: false,
        },
      });

      // Adicionar interação
      await prisma.interaction.create({
        data: {
          time: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "image",
          message: `🖼️ Imagem ${body["imagem-analisada"] ? `- ${body["imagem-analisada"]}` : "recebida"}`,
          response: "Recebida",
          sender,
        },
      });

      result = {
        type: "image",
        id: mediaMessage.id,
        analysis: body["imagem-analisada"],
        hasImage: !!imageBase64,
      };
    }
    
    // 4. DOCUMENTO
    else if (body["documento-base64"] || body["documento-conteudo"]) {
      messageType = "documento";
      
      const documentBase64 = body["documento-base64"];
      
      // Calcular tamanho aproximado
      const base64Data = documentBase64 ? documentBase64.split(",")[1] : "";
      const approximateSize = base64Data ? Math.floor((base64Data.length * 3) / 4) : 0;

      const mediaMessage = await prisma.mediaMessage.create({
        data: {
          sender,
          mediaBase64: documentBase64 || "",
          mediaType: "document",
          mimeType: documentBase64 
            ? documentBase64.split(";")[0].split(":")[1] 
            : "application/octet-stream",
          fileName: `document_${Date.now()}`,
          fileSize: approximateSize,
          caption: body["documento-conteudo"] || null,
          messageId,
          receivedAt: timestamp,
          processed: false,
        },
      });

      // Adicionar interação
      await prisma.interaction.create({
        data: {
          time: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "document",
          message: `📄 Documento ${body["documento-conteudo"] ? `- ${body["documento-conteudo"]}` : "recebido"}`,
          response: "Recebida",
          sender,
        },
      });

      result = {
        type: "document",
        id: mediaMessage.id,
        content: body["documento-conteudo"],
        hasDocument: !!documentBase64,
      };
    }
    
    // 5. MENSAGEM VAZIA OU NÃO RECONHECIDA
    else {
      return NextResponse.json(
        { error: "Nenhum tipo de mensagem válido encontrado no payload" },
        { status: 400 }
      );
    }

    // Atualizar estatísticas gerais
    await prisma.botStats.upsert({
      where: { id: "1" },
      create: {
        id: "1",
        totalMessages: 1,
        audioConverted: 0,
        responsesSent: 0,
        leadsAttended: 1,
        automationRate: 0.95,
        uptime: 1,
        averageResponseTime: 1.2,
        lastUpdated: new Date(),
      },
      update: {
        totalMessages: { increment: 1 },
        lastUpdated: new Date(),
      },
    });

    // Verificar se é um novo lead (checkar todas as tabelas)
    const [textCount, audioCount, mediaCount] = await Promise.all([
      prisma.textMessage.count({ where: { sender } }),
      prisma.audioMessage.count({ where: { sender } }),
      prisma.mediaMessage.count({ where: { sender } }),
    ]);

    const totalMessages = textCount + audioCount + mediaCount;
    if (totalMessages === 1) {
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
      message: `Mensagem de ${messageType} processada com sucesso`,
      data: {
        ...result,
        sender,
        receivedAt: timestamp,
        isNewLead: totalMessages === 1,
        messageId,
      },
    });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}