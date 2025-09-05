"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  MessageSquare,
  Mic,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Zap,
  Image,
  FileText,
  Calendar,
  BarChart3,
  Timer,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface BotStats {
  totalMessages: number
  audioConverted: number
  responsesSent: number
  leadsAttended: number
  messagesPerDay: number
  totalMediaMessages: number
  averageResponseTime: number
  uptime: number
}

interface DailyMetric {
  day: string
  textMessages: number
  audioMessages: number
}

interface Interaction {
  time: string
  type: string
  message: string
  response: string
  sender?: string
}

interface SystemHealth {
  status: string
  lastExecution: string | Date
  failuresLast24h: number
  performanceScore: number
}

interface DashboardData {
  botStats: BotStats
  dailyMetrics: DailyMetric[]
  recentInteractions: Interaction[]
  systemHealth: SystemHealth
}

export default function BotDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard')
      }
      const data: DashboardData = await response.json()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { botStats, dailyMetrics, recentInteractions, systemHealth } = dashboardData

  // Formatação do tempo da última execução
  const formatLastExecution = (lastExecution: string | Date) => {
    const date = new Date(lastExecution)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60) // minutos
    
    if (diff < 1) return "Agora"
    if (diff === 1) return "Há 1 minuto"
    if (diff < 60) return `Há ${diff} minutos`
    
    const hours = Math.floor(diff / 60)
    if (hours === 1) return "Há 1 hora"
    if (hours < 24) return `Há ${hours} horas`
    
    const days = Math.floor(hours / 24)
    if (days === 1) return "Há 1 dia"
    return `Há ${days} dias`
  }

  // Configurações dos gráficos com dados reais
  const lineChartOptions = {
    chart: {
      type: "line" as const,
      height: 350,
      toolbar: { show: false },
      background: "transparent",
    },
    colors: ["#3b82f6", "#10b981"],
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    xaxis: {
      categories: dailyMetrics.map((item) => item.day),
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 3,
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "right" as const,
      labels: {
        colors: "#64748b",
      },
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
      },
    },
  }

  const lineChartSeries = [
    {
      name: "Mensagens de Texto",
      data: dailyMetrics.map((item) => item.textMessages),
    },
    {
      name: "Mensagens de Áudio",
      data: dailyMetrics.map((item) => item.audioMessages),
    },
  ]


  const areaChartOptions = {
    chart: {
      type: "area" as const,
      height: 200,
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    colors: ["#10b981"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
    stroke: {
      curve: "smooth" as const,
      width: 2,
    },
    tooltip: {
      enabled: false,
    },
  }

  const areaChartSeries = [
    {
      name: "Performance",
      data: [65, 70, 75, 80, 85, 88, 92, 95, 98, systemHealth.performanceScore],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard do Bot de Atendimento</h1>
              <p className="text-blue-100 text-lg">
                Acompanhe em tempo real tudo que seu bot está fazendo por você no WhatsApp.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`px-4 py-2 ${
                systemHealth.status === "Ativo" 
                  ? "bg-green-500/20 text-green-100 border-green-400" 
                  : "bg-red-500/20 text-red-100 border-red-400"
              }`}>
                <CheckCircle className="w-5 h-5 mr-2" />
                {systemHealth.status}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold">{(botStats.uptime * 100).toFixed(1)}%</div>
                <div className="text-sm text-blue-200">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Mensagens Recebidas</CardTitle>
              <MessageSquare className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-white mt-1">Quantos clientes entraram em contato</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Dados em tempo real</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Áudios Convertidos</CardTitle>
              <Mic className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.audioConverted.toLocaleString()}</div>
              <p className="text-xs text-white mt-1">Quantos áudios o bot transformou em texto</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Processamento automático</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Mensagens por Dia</CardTitle>
              <Calendar className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.messagesPerDay}</div>
              <p className="text-xs text-white mt-1">Média de mensagens recebidas por dia</p>
              <div className="flex items-center mt-2">
                <BarChart3 className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Baseado nos últimos 7 dias</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Tempo Médio</CardTitle>
              <Timer className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.averageResponseTime}s</div>
              <p className="text-xs text-white mt-1">Tempo médio de processamento</p>
              <div className="flex items-center mt-2">
                <Zap className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Performance otimizada</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segunda linha de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Leads Únicos</CardTitle>
              <Users className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.leadsAttended}</div>
              <p className="text-xs text-white mt-1">Contatos únicos que interagiram</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Sem duplicatas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Mídias Recebidas</CardTitle>
              <Image className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.totalMediaMessages}</div>
              <p className="text-xs text-white mt-1">Imagens e documentos enviados</p>
              <div className="flex items-center mt-2">
                <FileText className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Fotos, PDFs, etc</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Respostas Enviadas</CardTitle>
              <Send className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{botStats.responsesSent}</div>
              <p className="text-xs text-white mt-1">Total de respostas processadas</p>
              <div className="flex items-center mt-2">
                <Activity className="w-4 h-4 mr-1 text-white" />
                <p className="text-xs text-white">Automático + manual</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Interações por Dia</CardTitle>
              <CardDescription className="text-gray-600">
                Veja como os clientes estão falando com o bot ao longo da semana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Chart options={lineChartOptions} series={lineChartSeries} type="line" height={350} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Tipos de Mídia</CardTitle>
              <CardDescription className="text-gray-600">
                Distribuição dos tipos de conteúdo recebidos dos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Mensagens de Texto</h3>
                      <p className="text-sm text-gray-600">Conversas diretas</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((botStats.totalMessages - botStats.audioConverted - botStats.totalMediaMessages) / botStats.totalMessages * 100) || 0}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="w-8 h-8 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Mensagens de Áudio</h3>
                      <p className="text-sm text-gray-600">Áudios transcritos</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(botStats.audioConverted / botStats.totalMessages * 100) || 0}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Image className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Imagens e Documentos</h3>
                      <p className="text-sm text-gray-600">Arquivos e fotos</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(botStats.totalMediaMessages / botStats.totalMessages * 100) || 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Exemplos Recentes</CardTitle>
              <CardDescription className="text-gray-600">
                Veja alguns atendimentos feitos pelo bot em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInteractions.map((interaction, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100"
                  >
                    <div className="flex-shrink-0">
                      {interaction.type === "áudio" ? (
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Mic className="w-4 h-4 text-emerald-600" />
                        </div>
                      ) : interaction.type === "image" ? (
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Image className="w-4 h-4 text-purple-600" />
                        </div>
                      ) : interaction.type === "document" ? (
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-800">{interaction.time}</span>
                          {interaction.sender && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {interaction.sender.replace(/@.*$/, '')}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {interaction.response}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{interaction.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Saúde do Sistema</CardTitle>
              <CardDescription className="text-gray-600">
                Se houver falhas, este painel mostrará imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <Chart options={areaChartOptions} series={areaChartSeries} type="area" height={120} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{botStats.averageResponseTime}s</div>
                  <div className="text-sm text-blue-700">Tempo Médio de Resposta</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{(botStats.uptime * 100).toFixed(1)}%</div>
                  <div className="text-sm text-green-700">Uptime (últimas 24h)</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className={`w-5 h-5 ${systemHealth.status === "Ativo" ? "text-green-500" : "text-red-500"}`} />
                    <span className="font-medium text-gray-800">Status do Fluxo</span>
                  </div>
                  <Badge className={`${
                    systemHealth.status === "Ativo" 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                  }`}>
                    {systemHealth.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-800">Última Execução Bem-sucedida</span>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {formatLastExecution(systemHealth.lastExecution)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className={`w-5 h-5 ${systemHealth.failuresLast24h > 0 ? "text-red-500" : "text-yellow-500"}`} />
                    <span className="font-medium text-gray-800">Falhas Registradas</span>
                  </div>
                  <span className={`text-sm font-medium ${systemHealth.failuresLast24h > 0 ? "text-red-600" : "text-green-600"}`}>
                    {systemHealth.failuresLast24h} nas últimas 24h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}