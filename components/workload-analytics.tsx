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
  const { trainings, periodRange } = useTraining()
  const [taxRate, setTaxRate] = useState(23)

  const monthlyData = useMemo(() => {
    if (!periodRange) return []

    const data: MonthlyData[] = []

    // Create new Date pointers to iterate from start to end month
    const start = new Date(periodRange.start)
    const end = new Date(periodRange.end)

    // Iterate month by month
    const current = new Date(start.getFullYear(), start.getMonth(), 1)

    while (current <= end) {
      const monthIdx = current.getMonth()
      const year = current.getFullYear()

      let totalHours = 0
      let totalRevenue = 0
      let totalSessions = 0

      const processedExtrasForMonth = new Set<string>()

      trainings.forEach(training => {
        training.sessions.forEach(session => {
          const sDate = new Date(session.date)
          if (sDate.getMonth() === monthIdx && sDate.getFullYear() === year) {
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
        month: monthNames[monthIdx].slice(0, 3) + (year !== 2026 ? `'${year.toString().slice(2)}` : ''), // Add year if not 2026
        monthIndex: monthIdx,
        hours: totalHours,
        revenue: totalRevenue,
        sessions: totalSessions,
      })

      // Move to next month
      current.setMonth(current.getMonth() + 1)
    }

    return data
  }, [trainings, periodRange])

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
    // Helper to calculate revenue for specific months across all trainings
    const calculateRevenueForMonths = (targetMonths: number[]) => {
      let revenue = 0
      // Need to track extras logic here too? YES.
      // For simplification, let's reuse a similar logic:
      targetMonths.forEach(month => {
        const year = 2026 // Fixed to 2026 for now as per original logic context
        const processedExtras = new Set<string>()

        trainings.forEach(t => {
          // 1. Session Income in this month
          t.sessions.forEach(s => {
            const d = new Date(s.date)
            if (d.getMonth() === month && d.getFullYear() === year) {
              revenue += parseInt(s.duration) * t.hourlyRate
            }
          })

          // 2. Extras in this month
          const hasActivity = t.sessions.some(s => {
            const d = new Date(s.date)
            return d.getMonth() === month && d.getFullYear() === year
          })
          if (hasActivity && t.extraValue && !processedExtras.has(t.id)) {
            revenue += t.extraValue
            processedExtras.add(t.id)
          }
        })
      })
      return revenue
    }

    // Payment 1: Jan (0) + Feb (1) -> Paid in March
    const period1Revenue = calculateRevenueForMonths([0, 1])

    // Payment 2: Mar (2) + Apr (3) + May (4) -> Paid in June
    const period2Revenue = calculateRevenueForMonths([2, 3, 4])

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
  }, [trainings, taxRate])

  // Define colors for charts (computed in JS, not CSS variables)
  const chartColors = {
    hours: "#22c55e",
    revenue: "#3b82f6",
    sessions: "#f59e0b",
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IRS Simulation Card */}
        <Card className="bg-card border-border md:col-span-2 bg-gradient-to-r from-primary/5 to-transparent">
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
            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pagamento em Março</span>
                  <span className="text-xs text-muted-foreground mt-1">Janeiro e Fevereiro</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{irsData.period1.tax.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
                  <span className="text-sm text-muted-foreground">de {irsData.period1.revenue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€ imposto base</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pagamento em Junho</span>
                  <span className="text-xs text-muted-foreground mt-1">Março, Abril e Maio</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{irsData.period2.tax.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
                  <span className="text-sm text-muted-foreground">de {irsData.period2.revenue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€ imposto base</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: '100%' }}></div>
                </div>
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
                <p className="text-xs text-muted-foreground">Período Selecionado</p>
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
                <p className="text-xs text-muted-foreground">Período Selecionado</p>
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
      <div className="grid grid-cols-1 gap-6">
        {/* Workload Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Carga de Trabalho Mensal</CardTitle>
            <CardDescription>Horas de formação por mês</CardDescription>
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
            <CardDescription>Valor a receber por mês</CardDescription>
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
    </div>
  )
}
