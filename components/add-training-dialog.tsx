"use client"

import { useState } from "react"
import { X, Plus, Calendar, User, Clock, Euro, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type Training, type TrainingSession } from "@/lib/training-data"

interface AddTrainingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (training: Training) => void
}

const COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-red-500",
    "bg-purple-600", "bg-pink-500", "bg-lime-500", "bg-cyan-500",
    "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500", "bg-violet-500"
]

const DAYS = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
]

export function AddTrainingDialog({ open, onOpenChange, onSave }: AddTrainingDialogProps) {
    const [step, setStep] = useState<1 | 2>(1)

    // Basic Info
    const [name, setName] = useState("")
    const [instructor, setInstructor] = useState("")
    const [hourlyRate, setHourlyRate] = useState("35")
    const [color, setColor] = useState(COLORS[0])
    const [extraValue, setExtraValue] = useState("")

    // Schedule Info
    const [startDate, setStartDate] = useState("")
    const [startTime, setStartTime] = useState("10:00")
    const [endTime, setEndTime] = useState("12:00")
    const [selectedDays, setSelectedDays] = useState<number[]>([])
    const [totalSessions, setTotalSessions] = useState("10")

    // Preview
    const [previewSessions, setPreviewSessions] = useState<TrainingSession[]>([])

    if (!open) return null

    const handleDayToggle = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    const generatePreview = () => {
        if (!startDate || selectedDays.length === 0 || !totalSessions) return

        const sessions: TrainingSession[] = []
        let current = new Date(startDate)
        let count = 0
        const target = parseInt(totalSessions)

        // Safety break
        let iterations = 0

        while (count < target && iterations < 365) { // Limit lookahead to 1 year
            if (selectedDays.includes(current.getDay())) {
                // Create session
                // Calculate duration
                const start = new Date(`2000-01-01T${startTime}`)
                const end = new Date(`2000-01-01T${endTime}`)
                const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                const duration = diffHrs + "h"

                sessions.push({
                    id: `preview-${count}`,
                    date: new Date(current),
                    time: `${startTime} - ${endTime}`,
                    duration,
                    trainingId: "temp"
                })
                count++
            }
            current.setDate(current.getDate() + 1)
            iterations++
        }
        setPreviewSessions(sessions)
        setStep(2)
    }

    const handleSave = () => {
        const trainingId = "t-" + Date.now() // Simple ID generation

        const newTraining: Training = {
            id: trainingId,
            name,
            instructor,
            hourlyRate: parseFloat(hourlyRate) || 0,
            color,
            extraValue: extraValue ? parseFloat(extraValue) : undefined,
            totalSessions: previewSessions.length,
            schedule: "Custom Schedule", // Could generate this string too
            sessions: previewSessions.map((s, i) => ({
                ...s,
                id: `${trainingId}-s${i}`,
                trainingId: trainingId
            }))
        }

        onSave(newTraining)
        onOpenChange(false)
        // Reset form?
        setStep(1)
        setPreviewSessions([])
        setName("")
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-card border-border shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold">Nova Formação</h2>
                        <p className="text-sm text-muted-foreground">
                            {step === 1 ? "Defina os detalhes da formação e cronograma." : "Confirme as sessões geradas."}
                        </p>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome da Formação</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Ex: Formação Excel Avançado"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Formador</label>
                                    <input
                                        value={instructor}
                                        onChange={e => setInstructor(e.target.value)}
                                        placeholder="Nome do formador"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor Hora (€)</label>
                                    <input
                                        type="number"
                                        value={hourlyRate}
                                        onChange={e => setHourlyRate(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor Extra (€)</label>
                                    <input
                                        type="number"
                                        value={extraValue}
                                        onChange={e => setExtraValue(e.target.value)}
                                        placeholder="Opcional"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cor</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-6 h-6 rounded-full transition-all ${c} ${color === c ? "ring-2 ring-foreground ring-offset-2" : "hover:scale-110"}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-border pt-4 space-y-4">
                                <h3 className="font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Cronograma Automático
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Data de Início</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Total de Sessões</label>
                                        <input
                                            type="number"
                                            value={totalSessions}
                                            onChange={e => setTotalSessions(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Dias da Semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map(day => (
                                            <button
                                                key={day.value}
                                                onClick={() => handleDayToggle(day.value)}
                                                className={`px-3 py-1.5 rounded-md text-sm transition-all ${selectedDays.includes(day.value)
                                                    ? "bg-primary text-primary-foreground font-medium"
                                                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Horário Início</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Horário Fim</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={generatePreview} disabled={!startDate || selectedDays.length === 0}>
                                    Seguinte: Rever Sessões
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-secondary/20 rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                                <h3 className="font-medium text-sm mb-3 text-muted-foreground">Sessões Geradas ({previewSessions.length})</h3>
                                {previewSessions.map((session, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-card rounded border border-border text-sm">
                                        <span className="font-medium">Sessão {i + 1}</span>
                                        <span>{session.date.toLocaleDateString('pt-PT')}</span>
                                        <span className="text-muted-foreground">{session.time}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between gap-3 pt-4 border-t border-border">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    Voltar
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                        Confirmar Criação
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
