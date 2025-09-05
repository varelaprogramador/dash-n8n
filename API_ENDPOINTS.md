# API Endpoints - Dashboard Bot n8n

## Visão Geral

Este projeto agora possui uma API completa integrada com Prisma e SQLite para gerenciar dados do seu bot de atendimento no WhatsApp. Perfeito para integração com n8n!

## Endpoints Disponíveis

### 🏠 Dashboard Principal
**GET** `/api/dashboard`
- Retorna todos os dados necessários para o dashboard
- Atualização automática a cada 30 segundos
- Fallback para dados mock se não houver dados no banco

### 💬 Interações
**GET** `/api/interactions?limit=10`
- Busca interações recentes
- Parâmetro `limit` opcional (padrão: 10)

**POST** `/api/interactions`
```json
{
  "time": "14:32",
  "type": "texto", // ou "áudio"
  "message": "Olá, gostaria de saber sobre preços",
  "response": "Enviada",
  "status": "Enviada" // opcional
}
```

### 📊 Estatísticas do Bot
**GET** `/api/bot-stats`
- Retorna estatísticas gerais do bot

**POST** `/api/bot-stats`
```json
{
  "totalMessages": 1247,
  "audioConverted": 342,
  "responsesSent": 1189,
  "leadsAttended": 89,
  "automationRate": 0.92,
  "uptime": 0.998,
  "averageResponseTime": 1.2
}
```

**PUT** `/api/bot-stats` (Incrementar contadores)
```json
{
  "incrementMessages": 1,
  "incrementAudio": 1,
  "incrementResponses": 1,
  "incrementLeads": 0
}
```

### 🏥 Saúde do Sistema
**GET** `/api/system-health`
- Status atual do sistema

**POST** `/api/system-health`
```json
{
  "status": "Ativo",
  "failuresLast24h": 0,
  "performanceScore": 99.8
}
```

**PUT** `/api/system-health`
- Registra execução bem-sucedida (atualiza lastExecution)

**PATCH** `/api/system-health`
- Registra uma falha (incrementa contador de falhas)

## 🔗 Integração com n8n

### Exemplo 1: Registrar Nova Interação
```http
POST http://localhost:3001/api/interactions
Content-Type: application/json

{
  "time": "{{ $now.format('HH:mm') }}",
  "type": "{{ $json.messageType }}",
  "message": "{{ $json.message }}",
  "response": "Enviada"
}
```

### Exemplo 2: Incrementar Estatísticas
```http
PUT http://localhost:3001/api/bot-stats
Content-Type: application/json

{
  "incrementMessages": 1,
  "incrementAudio": {{ $json.messageType === 'áudio' ? 1 : 0 }},
  "incrementResponses": 1
}
```

### Exemplo 3: Registrar Execução Bem-sucedida
```http
PUT http://localhost:3001/api/system-health
```

### Exemplo 4: Registrar Falha
```http
PATCH http://localhost:3001/api/system-health
```

## 🚀 Como Usar

1. **Servidor rodando**: `npm run dev` (porta 3001)
2. **Dashboard**: `http://localhost:3001`
3. **Banco populado**: Dados de exemplo já inseridos
4. **Auto-refresh**: Dashboard atualiza a cada 30 segundos

## 📝 Modelos de Dados

### Interaction
- `time`: Horário da interação (string)
- `type`: "texto" ou "áudio"
- `message`: Conteúdo da mensagem
- `response`: Status da resposta
- `status`: Status geral (padrão: "Enviada")

### BotStats
- `totalMessages`: Total de mensagens recebidas
- `audioConverted`: Áudios convertidos para texto
- `responsesSent`: Respostas enviadas
- `leadsAttended`: Leads únicos atendidos
- `automationRate`: Taxa de automação (0-1)
- `uptime`: Tempo online (0-1)
- `averageResponseTime`: Tempo médio de resposta (segundos)

### SystemHealth
- `status`: "Ativo", "Com Falhas", "Crítico"
- `lastExecution`: Timestamp da última execução
- `failuresLast24h`: Número de falhas nas últimas 24h
- `performanceScore`: Score de performance (0-100)

### DailyMetric
- `date`: Data da métrica
- `day`: Dia da semana ("Seg", "Ter", etc.)
- `textMessages`: Mensagens de texto do dia
- `audioMessages`: Mensagens de áudio do dia
- `totalMessages`: Total de mensagens do dia

## 🛠️ Comandos Úteis

```bash
# Iniciar desenvolvimento
npm run dev

# Popular banco com dados de exemplo
npx tsx prisma/seed.ts

# Ver estrutura do banco
npx prisma studio

# Reset do banco
npx prisma migrate reset
```

## 🎯 Pronto para Integração!

Agora você pode conectar seu fluxo n8n diretamente com estes endpoints para ter dados reais no seu dashboard em tempo real!