import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface N8NMessagePayload {
  // Remetente (obrigatório em todos os tipos)
  sender: string; // Número do WhatsApp: ex: 554398414904@s.whatsapp.net

  // Mensagem de texto
  mensagem?: string;

  // Imagem
  "imagem-base64"?: string;
  "imagem-analisada"?: string;

  // Documento
  "documento-base64"?: string;
  "documento-conteudo"?: string;
  mimetype?: string;

  // Áudio
  "audio-transcrito"?: string;
  "audio-base64"?: string;

  // Metadados opcionais
  messageId?: string;
  timestamp?: string;
  isGroup?: boolean;
  groupName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: N8NMessagePayload = await request.json();

    console.log("Webhook recebido:", body);
    console.log(
      "Tipo de áudio detectado:",
      body["audio-transcrito"] ? "com transcrição" : "sem transcrição"
    );
    console.log("Áudio base64 presente:", !!body["audio-base64"]);

    // Validar se sender foi enviado
    if (!body.sender) {
      return NextResponse.json(
        { error: "Campo 'sender' é obrigatório" },
        { status: 400 }
      );
    }

    // Extrair e limpar o número do WhatsApp
    const cleanPhoneNumber = (sender: string): string => {
      // Remove @s.whatsapp.net e @g.us para extrair apenas o número
      return sender.replace(/@(s\.whatsapp\.net|g\.us)$/, "");
    };

    const sender = body.sender;
    const cleanedSender = cleanPhoneNumber(sender);
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
          message:
            body.mensagem.length > 100
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

      // Processar áudio base64
      let audioBase64 = body["audio-base64"];

      // Se não tem prefixo data:, adicionar o prefixo padrão
      if (audioBase64 && !audioBase64.startsWith("data:")) {
        audioBase64 = `data:audio/ogg;base64,${audioBase64}`;
      }

      console.log(
        "Áudio base64 processado:",
        audioBase64 ? "presente" : "ausente"
      );

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
      if (
        imageBase64 &&
        !imageBase64.match(/^data:image\/[a-zA-Z0-9]+;base64,/)
      ) {
        return NextResponse.json(
          { error: "Formato de imagem base64 inválido" },
          { status: 400 }
        );
      }

      // Calcular tamanho aproximado
      const base64Data = imageBase64 ? imageBase64.split(",")[1] : "";
      const approximateSize = base64Data
        ? Math.floor((base64Data.length * 3) / 4)
        : 0;

      const mediaMessage = await prisma.mediaMessage.create({
        data: {
          sender,
          mediaBase64: imageBase64 || "",
          mediaType: "image",
          mimeType: imageBase64
            ? imageBase64.split(";")[0].split(":")[1]
            : "image/jpeg",
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
          message: `🖼️ Imagem ${
            body["imagem-analisada"]
              ? `- ${body["imagem-analisada"]}`
              : "recebida"
          }`,
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
      const mimeType =
        body.mimetype ||
        (documentBase64
          ? documentBase64.split(";")[0].split(":")[1]
          : "application/octet-stream");

      // Calcular tamanho aproximado
      const base64Data = documentBase64 ? documentBase64.split(",")[1] : "";
      const approximateSize = base64Data
        ? Math.floor((base64Data.length * 3) / 4)
        : 0;

      // Gerar nome do arquivo baseado no mimetype
      const getFileExtension = (mimeType: string) => {
        const extensions: { [key: string]: string } = {
          "application/pdf": "pdf",
          "application/msword": "doc",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            "docx",
          "application/vnd.ms-excel": "xls",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            "xlsx",
          "text/plain": "txt",
          "application/zip": "zip",
          "application/json": "json",
          "text/csv": "csv",
        };
        return extensions[mimeType] || "bin";
      };

      const fileExtension = getFileExtension(mimeType);
      const fileName = `document_${Date.now()}.${fileExtension}`;

      const mediaMessage = await prisma.mediaMessage.create({
        data: {
          sender,
          mediaBase64: documentBase64 || "",
          mediaType: "document",
          mimeType,
          fileName,
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
          message: `📄 ${fileName} ${
            body["documento-conteudo"]
              ? `- ${body["documento-conteudo"]}`
              : "recebido"
          }`,
          response: "Recebida",
          sender,
        },
      });

      result = {
        type: "document",
        id: mediaMessage.id,
        fileName,
        mimeType,
        content: body["documento-conteudo"],
        hasDocument: !!documentBase64,
        fileSize: approximateSize,
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
        uptime: 1,
        averageResponseTime: 1.2,
        lastUpdated: new Date(),
      },
      update: {
        totalMessages: { increment: 1 },
        lastUpdated: new Date(),
      },
    });

    // Verificar se é um novo lead (primeira mensagem de qualquer tipo deste sender)
    const existingInteractions = await prisma.interaction.count({
      where: { sender },
    });

    let isNewLead = false;
    if (existingInteractions === 1) {
      // A interação que acabamos de criar
      // É um novo lead
      isNewLead = true;
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
        sender: sender, // Formato completo: 554398414904@s.whatsapp.net
        phoneNumber: cleanedSender, // Apenas o número: 554398414904
        receivedAt: timestamp,
        isNewLead: isNewLead,
        messageId,
      },
    });
  } catch (error) {
    console.error("Erro no webhook:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
