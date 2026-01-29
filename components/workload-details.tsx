"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { monthNames } from "@/lib/training-data"
import { useTraining } from "@/context/training-context"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlyData {
    month: string
    monthIndex: number
    hours: number
    revenue: number
    sessions: number
}

export function WorkloadDetails() {
    const { trainings, periodRange } = useTraining()

    const monthlyData = useMemo(() => {
        if (!periodRange) return []

        const data: MonthlyData[] = []

        const start = new Date(periodRange.start)
        const end = new Date(periodRange.end)

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
                month: monthNames[monthIdx].slice(0, 3) + (year !== 2026 ? `'${year.toString().slice(2)}` : ''),
                monthIndex: monthIdx,
                hours: totalHours,
                revenue: totalRevenue,
                sessions: totalSessions,
            })

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
                const sDate = new Date(session.date)
                if (sDate >= periodRange.start && sDate <= periodRange.end) {
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
    }, [trainings, periodRange])

    const totals = useMemo(() => {
        if (monthlyData.length === 0) return { totalHours: 0, avgHoursPerMonth: 0, peakMonth: null }
        const totalHours = monthlyData.reduce((acc, m) => acc + m.hours, 0)
        const peakMonth = monthlyData.reduce((max, m) => m.hours > max.hours ? m : max, monthlyData[0])
        const avgHoursPerMonth = totalHours / monthlyData.length

        return { totalHours, avgHoursPerMonth, peakMonth }
    }, [monthlyData])

    return (
        <div className="space-y-6">
            {/* Critical Periods Analysis */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Períodos Críticos
                    </CardTitle>
                    <CardDescription>Meses com maior esforço</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                        {monthlyData.map((month) => {
                            const isHighWorkload = month.hours >= totals.avgHoursPerMonth * 1.2
                            const isLowWorkload = month.hours <= totals.avgHoursPerMonth * 0.5
                            const isPeakRevenue = month.revenue === Math.max(...monthlyData.map(m => m.revenue))

                            return (
                                <div
                                    key={month.month}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all",
                                        isHighWorkload ? "border-rose-500/50 bg-rose-500/5" :
                                            isLowWorkload ? "border-amber-500/50 bg-amber-500/5" :
                                                "border-border bg-secondary/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-foreground text-sm">{monthNames[month.monthIndex]}</h3>
                                        <div className="flex gap-1">
                                            {isHighWorkload && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                                                    Alta
                                                </span>
                                            )}
                                            {isPeakRevenue && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                                    $
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Horas:</span>
                                            <span className="font-medium text-foreground">{month.hours}h</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Rendimento:</span>
                                            <span className="font-medium text-foreground">{month.revenue.toLocaleString('pt-PT')}€</span>
                                        </div>
                                    </div>
                                    {/* Progress bar for workload */}
                                    <div className="mt-2">
                                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    isHighWorkload ? "bg-rose-500" :
                                                        isLowWorkload ? "bg-amber-500" : "bg-primary"
                                                )}
                                                style={{ width: `${totals.peakMonth && totals.peakMonth.hours > 0 ? (month.hours / totals.peakMonth.hours) * 100 : 0}%` }}
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
                    <CardTitle className="text-foreground">Rendimento</CardTitle>
                    <CardDescription>Por Formação</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {trainingBreakdown.map((training, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", training.color)} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-xs font-medium text-foreground truncate" title={training.fullName}>
                                            {training.name}
                                        </p>
                                        <p className="text-xs font-bold text-foreground ml-2">
                                            {training.revenue.toLocaleString('pt-PT')}€
                                        </p>
                                    </div>
                                    <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full", training.color)}
                                            style={{ width: `${trainingBreakdown[0].revenue > 0 ? (training.revenue / trainingBreakdown[0].revenue) * 100 : 0}%` }}
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
