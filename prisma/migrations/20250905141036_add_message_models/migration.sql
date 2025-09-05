-- AlterTable
ALTER TABLE "interactions" ADD COLUMN "sender" TEXT;

-- CreateTable
CREATE TABLE "text_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageId" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "groupName" TEXT,
    "quotedMessage" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audio_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender" TEXT NOT NULL,
    "audioBase64" TEXT NOT NULL,
    "audioMimeType" TEXT NOT NULL DEFAULT 'audio/ogg',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "transcription" TEXT,
    "messageId" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "media_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender" TEXT NOT NULL,
    "mediaBase64" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "messageId" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "text_messages_sender_idx" ON "text_messages"("sender");

-- CreateIndex
CREATE INDEX "text_messages_receivedAt_idx" ON "text_messages"("receivedAt");

-- CreateIndex
CREATE INDEX "audio_messages_sender_idx" ON "audio_messages"("sender");

-- CreateIndex
CREATE INDEX "audio_messages_receivedAt_idx" ON "audio_messages"("receivedAt");

-- CreateIndex
CREATE INDEX "media_messages_sender_idx" ON "media_messages"("sender");

-- CreateIndex
CREATE INDEX "media_messages_mediaType_idx" ON "media_messages"("mediaType");

-- CreateIndex
CREATE INDEX "media_messages_receivedAt_idx" ON "media_messages"("receivedAt");

-- CreateIndex
CREATE INDEX "interactions_sender_idx" ON "interactions"("sender");
