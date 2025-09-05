-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Enviada',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "day" TEXT NOT NULL,
    "textMessages" INTEGER NOT NULL DEFAULT 0,
    "audioMessages" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bot_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "audioConverted" INTEGER NOT NULL DEFAULT 0,
    "responsesSent" INTEGER NOT NULL DEFAULT 0,
    "leadsAttended" INTEGER NOT NULL DEFAULT 0,
    "automationRate" REAL NOT NULL DEFAULT 0.92,
    "uptime" REAL NOT NULL DEFAULT 0.998,
    "averageResponseTime" REAL NOT NULL DEFAULT 1.2,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_health" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "lastExecution" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failuresLast24h" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" REAL NOT NULL DEFAULT 99.8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_date_key" ON "daily_metrics"("date");
