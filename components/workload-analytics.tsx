"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { monthNames } from "@/lib/training-data"
import { useTraining } from "@/context/training-context"
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Euro } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlyData {
  month: string
  monthIndex: number
  hours: number
  revenue: number
  sessions: number
}

export function WorkloadAnalytics() {
  const { trainings } = useTraining()
  const [taxRate, setTaxRate] = useState(25)

  const monthlyData = useMemo(() => {
    const data: MonthlyData[] = []

    // January to June 2026 (months 0-5)
    for (let month = 0; month <= 5; month++) {
      let totalHours = 0
      let totalRevenue = 0
      let totalSessions = 0

      const processedExtrasForMonth = new Set<string>()

      trainings.forEach(training => {
        training.sessions.forEach(session => {
          if (session.date.getMonth() === month && session.date.getFullYear() === 2026) {
            const hours = parseInt(session.duration)
            totalHours += hours
            totalRevenue += hours * training.hourlyRate
            totalSessions++

            // Add extra value if applicable and not yet added for this month
            if (training.extraValue && !processedExtrasForMonth.has(training.id)) {
              totalRevenue += training.extraValue
              processedExtrasForMonth.add(training.id)
            }
          }
        })
      })

      data.push({
        month: monthNames[month].slice(0, 3),
        monthIndex: month,
        hours: totalHours,
        revenue: totalRevenue,
        sessions: totalSessions,
      })
    }

    return data
  }, [trainings])

  const trainingBreakdown = useMemo(() => {
    return trainings.map(training => {
      let totalHours = 0
      let totalRevenue = 0

      let hasActivityInPeriod = false

      training.sessions.forEach(session => {
        if (session.date.getFullYear() === 2026 && session.date.getMonth() <= 5) {
          const hours = parseInt(session.duration)
          totalHours += hours
          totalRevenue += hours * training.hourlyRate
          hasActivityInPeriod = true
        }
      })

      if (hasActivityInPeriod && training.extraValue) {
        totalRevenue += training.extraValue
      }

      return {
        name: training.name.length > 20 ? training.name.slice(0, 20) + "..." : training.name,
        fullName: training.name,
        hours: totalHours,
        revenue: totalRevenue,
        color: training.color,
        hourlyRate: training.hourlyRate,
      }
    }).filter(t => t.hours > 0).sort((a, b) => b.revenue - a.revenue)
  }, [trainings])

  const totals = useMemo(() => {
    const totalHours = monthlyData.reduce((acc, m) => acc + m.hours, 0)
    const totalRevenue = monthlyData.reduce((acc, m) => acc + m.revenue, 0)
    const totalSessions = monthlyData.reduce((acc, m) => acc + m.sessions, 0)
    const avgHoursPerMonth = totalHours / 6
    const peakMonth = monthlyData.reduce((max, m) => m.hours > max.hours ? m : max, monthlyData[0])
    const lowMonth = monthlyData.reduce((min, m) => m.hours < min.hours ? m : min, monthlyData[0])

    return { totalHours, totalRevenue, totalSessions, avgHoursPerMonth, peakMonth, lowMonth }
  }, [monthlyData])

  const irsData = useMemo(() => {
    // Payment 1: Jan (0) + Feb (1) -> Paid in March
    const period1Revenue = monthlyData
      .filter(m => m.monthIndex === 0 || m.monthIndex === 1)
      .reduce((acc, m) => acc + m.revenue, 0)

    // Payment 2: Mar (2) + Apr (3) + May (4) -> Paid in June
    const period2Revenue = monthlyData
      .filter(m => m.monthIndex >= 2 && m.monthIndex <= 4)
      .reduce((acc, m) => acc + m.revenue, 0)

    return {
      period1: {
        revenue: period1Revenue,
        tax: period1Revenue * (taxRate / 100)
      },
      period2: {
        revenue: period2Revenue,
        tax: period2Revenue * (taxRate / 100)
      }
    }
  }, [monthlyData, taxRate])

  // Define colors for charts (computed in JS, not CSS variables)
  const chartColors = {
    hours: "#22c55e",
    revenue: "#3b82f6",
    sessions: "#f59e0b",
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* IRS Simulation Card */}
        <Card className="bg-card border-border md:col-span-2 lg:col-span-4 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Euro className="w-5 h-5 text-primary" />
                Simulação IRS
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Taxa de Retenção:</span>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 h-8 rounded border border-input bg-background px-2 text-sm text-right"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <CardDescription>Estimativa de valores a pagar em Março (Jan+Fev) e Junho (Mar+Abr+Mai)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pagamento em Março</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{irsData.period1.tax.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
                  <span className="text-sm text-muted-foreground">de {irsData.period1.revenue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€ rendimento</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-muted-foreground mt-1">Corresponde a Janeiro e Fevereiro</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pagamento em Junho</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{irsData.period2.tax.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
                  <span className="text-sm text-muted-foreground">de {irsData.period2.revenue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€ rendimento</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-muted-foreground mt-1">Corresponde a Março, Abril e Maio</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Horas</p>
                <p className="text-2xl font-bold text-foreground">{totals.totalHours}h</p>
                <p className="text-xs text-muted-foreground">Jan - Jun 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Euro className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rendimento Total</p>
                <p className="text-2xl font-bold text-foreground">{totals.totalRevenue.toLocaleString('pt-PT')}€</p>
                <p className="text-xs text-muted-foreground">Jan - Jun 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pico de Carga</p>
                <p className="text-2xl font-bold text-foreground">{totals.peakMonth.hours}h</p>
                <p className="text-xs text-muted-foreground">{monthNames[totals.peakMonth.monthIndex]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Mensal</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(totals.avgHoursPerMonth)}h</p>
                <p className="text-xs text-muted-foreground">por mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Carga de Trabalho Mensal</CardTitle>
            <CardDescription>Horas de formação por mês (Jan - Jun 2026)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                hours: { label: "Horas", color: chartColors.hours },
                sessions: { label: "Sessões", color: chartColors.sessions },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" fill={chartColors.hours} name="Horas" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="sessions" stroke={chartColors.sessions} strokeWidth={2} name="Sessões" dot={{ fill: chartColors.sessions }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Rendimento Mensal</CardTitle>
            <CardDescription>Valor a receber por mês (Jan - Jun 2026)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Rendimento", color: chartColors.revenue },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString('pt-PT')}€`} />}
                  />
                  <Area type="monotone" dataKey="revenue" fill={chartColors.revenue} fillOpacity={0.2} stroke={chartColors.revenue} strokeWidth={2} name="Rendimento" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Critical Periods Analysis */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Análise de Períodos Críticos
          </CardTitle>
          <CardDescription>Identificação dos meses com maior esforço e rendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthlyData.map((month) => {
              const isHighWorkload = month.hours >= totals.avgHoursPerMonth * 1.2
              const isLowWorkload = month.hours <= totals.avgHoursPerMonth * 0.5
              const isPeakRevenue = month.revenue === Math.max(...monthlyData.map(m => m.revenue))

              return (
                <div
                  key={month.month}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    isHighWorkload ? "border-rose-500/50 bg-rose-500/5" :
                      isLowWorkload ? "border-amber-500/50 bg-amber-500/5" :
                        "border-border bg-secondary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{monthNames[month.monthIndex]}</h3>
                    {isHighWorkload && (
                      <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-400">
                        Alta Carga
                      </span>
                    )}
                    {isPeakRevenue && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        Maior Rend.
                      </span>
                    )}
                    {isLowWorkload && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                        Baixa Carga
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horas:</span>
                      <span className="font-medium text-foreground">{month.hours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sessões:</span>
                      <span className="font-medium text-foreground">{month.sessions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rendimento:</span>
                      <span className="font-medium text-foreground">{month.revenue.toLocaleString('pt-PT')}€</span>
                    </div>
                  </div>
                  {/* Progress bar for workload */}
                  <div className="mt-3">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isHighWorkload ? "bg-rose-500" :
                            isLowWorkload ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.min((month.hours / totals.peakMonth.hours) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Training */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Rendimento por Formação</CardTitle>
          <CardDescription>Distribuição do rendimento até Junho 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingBreakdown.map((training, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={cn("w-3 h-3 rounded-full shrink-0", training.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate" title={training.fullName}>
                      {training.name}
                    </p>
                    <p className="text-sm font-bold text-foreground ml-2">
                      {training.revenue.toLocaleString('pt-PT')}€
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{training.hours}h</span>
                    <span>{training.hourlyRate}€/h</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", training.color)}
                      style={{ width: `${(training.revenue / trainingBreakdown[0].revenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
