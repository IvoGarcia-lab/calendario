"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Euro, BarChart3, CalendarDays, MoreVertical, Pencil, Trash2, CalendarClock, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { monthNames, dayNames, type Training, type TrainingSession } from "@/lib/training-data"
import { useTraining } from "@/context/training-context"
import { WorkloadAnalytics } from "./workload-analytics"
import { EditSessionDialog } from "./edit-session-dialog"
import { AddTrainingDialog } from "./add-training-dialog"

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  sessions: (TrainingSession & { training: Training })[]
  totalHours: number
}

// Helper moved inside or adapted to use dynamic data
function getCalendarDays(year: number, month: number, currentTrainings: Training[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days: CalendarDay[] = []
  const currentDate = new Date(startDate)

  while (days.length < 42) {
    const sessionsForDay = currentTrainings.flatMap(training =>
      training.sessions
        .filter(session =>
          session.date.getDate() === currentDate.getDate() &&
          session.date.getMonth() === currentDate.getMonth() &&
          session.date.getFullYear() === currentDate.getFullYear()
        )
        .map(session => ({ ...session, training }))
    )

    const totalHours = sessionsForDay.reduce((acc, s) => acc + parseInt(s.duration), 0)

    days.push({
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      sessions: sessionsForDay,
      totalHours
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}

import { ManageExtrasDialog } from "./manage-extras-dialog"

export function TrainingCalendar() {
  const {
    trainings,
    adjustments, // New context
    taxRetentionRate, // New context
    addTraining,
    updateSession,
    deleteSession,
    // Context State
    analysisMode, setAnalysisMode,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    viewedDate, setViewedDate,
    periodRange
  } = useTraining()

  // const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)) // MOVED TO CONTEXT as viewedDate
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null)
  const [isAddingTraining, setIsAddingTraining] = useState(false)
  const [isManageExtrasOpen, setIsManageExtrasOpen] = useState(false) // New state
  const [isTrainingsListOpen, setIsTrainingsListOpen] = useState(false)

  // Load selected trainings from local storage or default to all
  useEffect(() => {
    if (trainings.length > 0) {
      const saved = localStorage.getItem("selected-trainings")
      if (saved) {
        setSelectedTrainings(JSON.parse(saved))
      } else {
        // Default to all selected if nothing saved
        setSelectedTrainings(trainings.map(t => t.id))
      }
    }
  }, [trainings])

  const calendarDays = useMemo(() =>
    getCalendarDays(viewedDate.getFullYear(), viewedDate.getMonth(), trainings),
    [viewedDate, trainings]
  )

  const filteredDays = useMemo(() =>
    calendarDays.map(day => ({
      ...day,
      sessions: day.sessions.filter(s => selectedTrainings.includes(s.trainingId))
    })),
    [calendarDays, selectedTrainings]
  )

  // Filter Adjustments for Current Month
  const currentMonthAdjustments = useMemo(() => {
    return adjustments.filter(adj => {
      const adjDate = new Date(adj.date)
      return adjDate.getMonth() === viewedDate.getMonth() &&
        adjDate.getFullYear() === viewedDate.getFullYear()
    })
  }, [adjustments, viewedDate])

  // State for Custom Analysis - MOVED TO CONTEXT
  // Helper to determine active range - MOVED TO CONTEXT (periodRange)

  // Filter Adjustments based on active range
  const periodAdjustments = useMemo(() => {
    return adjustments.filter(adj => {
      const d = new Date(adj.date)
      return d >= periodRange.start && d <= periodRange.end
    })
  }, [adjustments, periodRange])


  // Calculate Financials based on Period
  const { totalHours, grossTrainingIncome, grossExtrasTraining, grossAdjustments, totalGross, taxAmount, totalNet } = useMemo(() => {
    // 1. Training Sessions Income - Attach training data
    const sessionsWithTraining = trainings.flatMap(t =>
      t.sessions.map(s => ({ ...s, training: t }))
    )

    const sessionsInPeriod = sessionsWithTraining.filter(s => {
      const d = new Date(s.date)
      return d >= periodRange.start && d <= periodRange.end
    })

    const hours = sessionsInPeriod.reduce((acc, s) => acc + parseInt(s.duration), 0)
    const trainingIncome = sessionsInPeriod.reduce((acc, s) => acc + (parseInt(s.duration) * s.training.hourlyRate), 0)

    // 2. Training Fixed Extras logic for CUSTOM period
    // If strict month mode: existing logic.
    // If custom mode: We need rule. Let's assume: If training has ANY session in a specific month within the range, add extra ONCE per month?
    // User probably thinks of "Extras" as monthly recurrent fees. 
    // Implementation: For each month in the range, check which trainings are active, add their extra.

    // Simplification for now: Just count active trainings in the period and multiply by number of months? 
    // Easier: Check distinct (Training + Month) tuples.

    // Map sessions to Month keys "YYYY-MM"
    const uniqueTrainingMonths = new Set<string>()
    sessionsInPeriod.forEach(s => {
      const k = `${s.training.id}-${s.date.getFullYear()}-${s.date.getMonth()}`
      uniqueTrainingMonths.add(k) // Set of unique "Training X is active in Month Y"
    })

    // Calculate total fixed extras based on how many months each training was active
    let trainingExtras = 0
    uniqueTrainingMonths.forEach(key => {
      const [tid] = key.split('-')
      const t = trainings.find(t => t.id === tid)
      if (t && t.extraValue) {
        trainingExtras += t.extraValue
      }
    })


    // 3. Manual Adjustments
    const manualAdj = periodAdjustments.reduce((acc, adj) => acc + adj.value, 0)

    // 4. Totals
    const gross = trainingIncome + trainingExtras + manualAdj
    const tax = gross * (taxRetentionRate / 100)
    const net = gross - tax

    return {
      totalHours: hours,
      grossTrainingIncome: trainingIncome,
      grossExtrasTraining: trainingExtras,
      grossAdjustments: manualAdj,
      totalGross: gross,
      taxAmount: tax,
      totalNet: net
    }
  }, [trainings, periodRange, periodAdjustments, taxRetentionRate])

  const goToPreviousMonth = () => {
    setViewedDate(new Date(viewedDate.getFullYear(), viewedDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setViewedDate(new Date(viewedDate.getFullYear(), viewedDate.getMonth() + 1, 1))
  }

  const toggleTraining = (trainingId: string) => {
    setSelectedTrainings(prev =>
      prev.includes(trainingId)
        ? prev.filter(id => id !== trainingId)
        : [...prev, trainingId]
    )
  }

  const allSessionsForMonth = useMemo(() => {
    return filteredDays
      .filter(day => day.isCurrentMonth && day.sessions.length > 0)
      .flatMap(day => day.sessions.map(s => ({ ...s, dayDate: day.date })))
      .sort((a, b) => a.dayDate.getTime() - b.dayDate.getTime())
  }, [filteredDays])

  const handleSaveSession = (sessionId: string, updates: Partial<TrainingSession>) => {
    if (editingSession) {
      updateSession(editingSession.trainingId, sessionId, updates)
      setEditingSession(null)
    }
  }

  const handleDeleteSession = (trainingId: string, sessionId: string) => {
    if (confirm("Tem a certeza que deseja eliminar esta sessão?")) {
      deleteSession(trainingId, sessionId)
    }
  }

  const handleDragStart = (e: React.DragEvent, sessionId: string, trainingId: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ sessionId, trainingId }))
    e.dataTransfer.effectAllowed = "move"
    // Optional: Set drag image or styling
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      if (data.sessionId && data.trainingId) {
        // Create a new date at midnight to match data structure
        const newDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
        updateSession(data.trainingId, data.sessionId, { date: newDate })
      }
    } catch (err) {
      console.error("Failed to parse drag data", err)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <EditSessionDialog
        session={editingSession}
        open={!!editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
        onSave={handleSaveSession}
      />
      <AddTrainingDialog
        open={isAddingTraining}
        onOpenChange={setIsAddingTraining}
        onSave={(training) => addTraining(training)}
      />
      <ManageExtrasDialog
        open={isManageExtrasOpen}
        onOpenChange={setIsManageExtrasOpen}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Calendário de Formações
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as sessões das formações programadas para 2026
          </p>
        </div>

        {/* Legend Update */}
        <div className="mb-6 flex flex-wrap gap-4 justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/30 px-3 py-1.5 rounded-md">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/30 px-3 py-1.5 rounded-md">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></span>
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground bg-secondary/30 px-3 py-1.5 rounded-md">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></span>
              <span>Cancelado</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground border-l border-border pl-4">
            <span className="uppercase font-semibold tracking-wider">Carga Diária (Aulas):</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500"></div>
              <span>Leve (&lt; 4h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500"></div>
              <span>Média (4h - 7h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500"></div>
              <span className="font-bold text-rose-500">Intensa (&gt; 7h)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-8 transition-all duration-300">
              <div
                className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsTrainingsListOpen(!isTrainingsListOpen)}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Gestão de Aulas</h2>
                  {isTrainingsListOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsAddingTraining(true) }}>
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {isTrainingsListOpen && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {trainings.map(training => (
                    <button
                      key={training.id}
                      onClick={() => toggleTraining(training.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-md transition-all text-left",
                        selectedTrainings.includes(training.id)
                          ? "bg-secondary"
                          : "opacity-40 hover:opacity-60"
                      )}
                    >
                      <div className={cn("w-3 h-3 rounded-full shrink-0", training.color)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {training.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {training.instructor} • {training.totalSessions} aulas • {training.hourlyRate}€/h
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Extras Breakdown */}
            <div className="bg-card rounded-lg border border-border p-4 relative group">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Extras & Ajustes
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsManageExtrasOpen(true)}>
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* Fixed Training Extras */}
                {trainings.filter(t => t.extraValue && t.sessions.some(s => {
                  const d = new Date(s.date)
                  return d >= periodRange.start && d <= periodRange.end
                })).map(t => (
                  <div key={t.id + "-extra"} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground truncate pr-2 text-xs">
                      {t.name}
                    </span>
                    <span className="font-medium text-emerald-500 whitespace-nowrap text-xs">+{t.extraValue}€/mês</span>
                  </div>
                ))}

                {analysisMode === 'custom' && (
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 mt-2">Ajustes do Período</div>
                )}

                {/* Manual Adjustments Display */}
                {periodAdjustments.length > 0 ? periodAdjustments.map(adj => (
                  <div key={adj.id} className="flex justify-between items-center text-sm border-t border-border/50 pt-2 border-dashed">
                    <span className="text-muted-foreground truncate pr-2 italic">{adj.description}</span>
                    <span className={cn(
                      "font-medium whitespace-nowrap",
                      adj.value >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {adj.value > 0 ? "+" : ""}{adj.value}€
                    </span>
                  </div>
                )) : (
                  <div className="text-xs text-muted-foreground italic text-center py-2">
                    {analysisMode === 'month' ? "Sem ajustes este mês." : "Sem ajustes neste período."}
                  </div>
                )}

                {(grossExtrasTraining + grossAdjustments) !== 0 && (
                  <div className="pt-2 mt-2 border-t border-border flex justify-between items-center font-bold">
                    <span>Total Extras</span>
                    <span className={cn(
                      (grossExtrasTraining + grossAdjustments) >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {(grossExtrasTraining + grossAdjustments) > 0 ? "+" : ""}
                      {(grossExtrasTraining + grossAdjustments).toLocaleString('pt-PT')}€
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats - UPDATED for IRS & Custom Period */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Análise Financeira
                </h2>
                {/* Period Toggle */}
                <div className="flex bg-secondary/30 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setAnalysisMode('month')}
                    className={cn(
                      "px-2 py-1 rounded-md transition-all",
                      analysisMode === 'month' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setAnalysisMode('custom')}
                    className={cn(
                      "px-2 py-1 rounded-md transition-all",
                      analysisMode === 'custom' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Período
                  </button>
                </div>
              </div>

              {/* Custom Period Selectors */}
              {analysisMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">De:</span>
                    <div className="relative">
                      <input
                        type="month"
                        className="w-full text-xs bg-secondary/20 border border-border rounded px-2 py-1"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Até:</span>
                    <div className="relative">
                      <input
                        type="month"
                        className="w-full text-xs bg-secondary/20 border border-border rounded px-2 py-1"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {totalHours}h
                    </p>
                    <p className="text-xs text-muted-foreground">Total Horas ({analysisMode === 'month' ? monthNames[viewedDate.getMonth()] : 'Período'})</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  {/* Breakdown */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Rendimento Aulas</span>
                    <span>{grossTrainingIncome.toLocaleString('pt-PT')}€</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Rendimento Extras</span>
                    <span>{(grossExtrasTraining + grossAdjustments).toLocaleString('pt-PT')}€</span>
                  </div>

                  {/* Gross */}
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-border/50">
                    <span className="text-foreground font-medium">Rendimento Bruto</span>
                    <span className="font-bold">{totalGross.toLocaleString('pt-PT')}€</span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center text-sm text-rose-500/90">
                    <span className="flex items-center gap-1">
                      Retenção na Fonte
                      <span className="text-[10px] px-1 bg-rose-500/10 rounded font-bold">{taxRetentionRate}%</span>
                    </span>
                    <span>-{taxAmount.toLocaleString('pt-PT')}€</span>
                  </div>

                  {/* Net */}
                  <div className="pt-2 mt-1 border-t border-border flex justify-between items-end">
                    <span className="text-sm font-bold text-foreground">Rendimento Líquido</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-500">
                        {totalNet.toLocaleString('pt-PT')}€
                      </p>
                      {analysisMode === 'custom' && <span className="text-[10px] text-muted-foreground block text-right font-normal">Valor acumulado do período</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  {monthNames[viewedDate.getMonth()]} {viewedDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 border-b border-border">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {filteredDays.map((day, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => day.sessions.length > 0 && setSelectedDay(day)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.date)}
                    className={cn(
                      "min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-r border-border text-left transition-all relative group font-sans select-none",
                      !day.isCurrentMonth && "bg-secondary/30",
                      day.sessions.length > 0 && "hover:bg-secondary/50 cursor-pointer",
                      day.sessions.length === 0 && "cursor-default border-b",
                      // Heatmap Logic for Border Bottom & Background
                      day.sessions.length > 0 && day.totalHours < 4 && "bg-emerald-500/20 border-b-4 border-b-emerald-500 hover:bg-emerald-500/30",
                      day.sessions.length > 0 && day.totalHours >= 4 && day.totalHours <= 7 && "bg-amber-500/20 border-b-4 border-b-amber-500 hover:bg-amber-500/30",
                      day.sessions.length > 0 && day.totalHours > 7 && "bg-rose-500/20 border-b-4 border-b-rose-500 hover:bg-rose-500/30"
                    )}
                  >
                    <div className="flex justify-between items-start pointer-events-none">
                      <span className={cn(
                        "text-sm font-medium",
                        day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {day.date.getDate()}
                      </span>
                      {day.totalHours > 0 && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-background/50 backdrop-blur-sm",
                          day.totalHours > 7 ? "text-rose-500" : "text-foreground"
                        )}>
                          {day.totalHours}h
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1">
                      {day.sessions.slice(0, 3).map((session, sessionIndex) => (
                        <div
                          key={sessionIndex}
                          draggable
                          onDragStart={(e) => handleDragStart(e, session.id, session.trainingId)}
                          onClick={(e) => e.stopPropagation()} // Prevent selecting day when clicking session
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate text-white shadow-sm cursor-grab active:cursor-grabbing hover:brightness-110",
                            session.training.color
                          )}
                        >
                          <span className="hidden md:inline">{session.time.split(" - ")[0]}</span>
                          <span className="md:hidden">{session.training.name.slice(0, 8)}</span>
                        </div>
                      ))}
                      {day.sessions.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1 font-medium pointer-events-none">
                          +{day.sessions.length - 3} aulas
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session List */}
            <div className="mt-6 bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedDay
                    ? `Aulas de ${selectedDay.date.getDate()} de ${monthNames[selectedDay.date.getMonth()]}`
                    : `Todas as aulas de ${monthNames[viewedDate.getMonth()]}`
                  }
                </h2>
              </div>
              <div className="divide-y divide-border max-h-[400px] overflow-auto">
                {(selectedDay ? selectedDay.sessions : allSessionsForMonth).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma aula programada
                  </div>
                ) : (
                  (selectedDay ? selectedDay.sessions : allSessionsForMonth).map((session, index) => (
                    <div key={index} className="group flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                      <div className={cn("w-1 h-12 rounded-full shrink-0", session.training.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {session.training.name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {session.training.instructor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="w-3 h-3" />
                            {session.training.hourlyRate}€/h
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {!selectedDay && (
                          <p className="text-sm font-medium text-foreground">
                            {'dayDate' in session && (session as { dayDate: Date }).dayDate.getDate()} {monthNames[viewedDate.getMonth()].slice(0, 3)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{session.time}</p>

                        <div className="flex justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSession(session)
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSession(session.trainingId, session.id)
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedDay && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDay(null)}
                    className="w-full"
                  >
                    Ver todas as aulas do mês
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div >
    </div >
  )
}
