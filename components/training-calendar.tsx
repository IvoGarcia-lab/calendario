"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Euro, BarChart3, CalendarDays, MoreVertical, Pencil, Trash2, CalendarClock, Plus } from "lucide-react"
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

    days.push({
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      sessions: sessionsForDay
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}

export function TrainingCalendar() {
  const { trainings, updateSession, deleteSession, addTraining } = useTraining()
  const [activeTab, setActiveTab] = useState<"calendar" | "analytics">("calendar")
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)) // February 2026
  // Initialize with null first, then fill in useEffect or leave empty initially if trainings might be empty
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([])
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null)
  const [isAddingTraining, setIsAddingTraining] = useState(false)

  // Ensure new trainings are selected when they appear (fixes hot reload/update issues)
  useEffect(() => {
    if (trainings.length > 0) {
      setSelectedTrainings(prev => {
        const allIds = trainings.map(t => t.id)
        if (prev.length === 0) return allIds // Select all on first load
        const newIds = allIds.filter(id => !prev.includes(id))
        return newIds.length > 0 ? [...prev, ...newIds] : prev
      })
    }
  }, [trainings])
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const calendarDays = useMemo(() =>
    getCalendarDays(currentDate.getFullYear(), currentDate.getMonth(), trainings),
    [currentDate, trainings]
  )

  const filteredDays = useMemo(() =>
    calendarDays.map(day => ({
      ...day,
      sessions: day.sessions.filter(s => selectedTrainings.includes(s.trainingId))
    })),
    [calendarDays, selectedTrainings]
  )

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
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

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="inline-flex p-1 bg-secondary/50 rounded-xl">
            <button
              onClick={() => setActiveTab("calendar")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "calendar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Calendário
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "analytics"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Análise de Carga e Rendimento
            </button>
          </div>
        </div>

        {activeTab === "analytics" ? (
          <WorkloadAnalytics />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Training Legend */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Formações
                  </h2>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAddingTraining(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
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
                          {training.instructor} • {training.totalSessions} sessões • {training.hourlyRate}€/h
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>


              {/* Extras Breakdown */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Extras & Ajustes
                </h2>
                <div className="space-y-3">
                  {trainings.filter(t => t.extraValue).map(t => (
                    <div key={t.id + "-extra"} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{t.name}</span>
                      <span className="font-medium text-emerald-500">+{t.extraValue}€</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-border flex justify-between items-center font-bold">
                    <span>Total Extras</span>
                    <span>+{trainings.reduce((acc, t) => acc + (t.extraValue || 0), 0)}€</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Resumo do Mês
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {allSessionsForMonth.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Sessões</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {allSessionsForMonth.reduce((acc, s) => acc + parseInt(s.duration), 0)}h
                      </p>
                      <p className="text-xs text-muted-foreground">Total de horas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Euro className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {(allSessionsForMonth.reduce((acc, s) => acc + (parseInt(s.duration) * s.training.hourlyRate), 0) +
                          Array.from(new Set(allSessionsForMonth.map(s => s.training))).reduce((acc, t) => acc + (t.extraValue || 0), 0)
                        ).toLocaleString('pt-PT')}€
                      </p>
                      <p className="text-xs text-muted-foreground">Faturação Est. (Sessões + Extras)</p>
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
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
                    <button
                      key={index}
                      onClick={() => day.sessions.length > 0 && setSelectedDay(day)}
                      className={cn(
                        "min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-b border-r border-border text-left transition-colors",
                        !day.isCurrentMonth && "bg-secondary/30",
                        day.sessions.length > 0 && "hover:bg-secondary/50 cursor-pointer",
                        day.sessions.length === 0 && "cursor-default"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {day.date.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {day.sessions.slice(0, 3).map((session, sessionIndex) => (
                          <div
                            key={sessionIndex}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded truncate text-white",
                              session.training.color
                            )}
                          >
                            <span className="hidden md:inline">{session.time.split(" - ")[0]}</span>
                            <span className="md:hidden">{session.training.name.slice(0, 8)}</span>
                          </div>
                        ))}
                        {day.sessions.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{day.sessions.length - 3} mais
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session List */}
              <div className="mt-6 bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedDay
                      ? `Sessões de ${selectedDay.date.getDate()} de ${monthNames[selectedDay.date.getMonth()]}`
                      : `Todas as sessões de ${monthNames[currentDate.getMonth()]}`
                    }
                  </h2>
                </div>
                <div className="divide-y divide-border max-h-[400px] overflow-auto">
                  {(selectedDay ? selectedDay.sessions : allSessionsForMonth).length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhuma sessão programada
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
                              {'dayDate' in session && (session as { dayDate: Date }).dayDate.getDate()} {monthNames[currentDate.getMonth()].slice(0, 3)}
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
                      Ver todas as sessões do mês
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
        }
      </div >
    </div >
  )
}
