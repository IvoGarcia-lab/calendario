"use client"

import { useState, useEffect } from "react"
import { X, Calendar as CalendarIcon, Clock, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type TrainingSession } from "@/lib/training-data"
import { format } from "date-fns"

interface EditSessionDialogProps {
    session: TrainingSession | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (sessionId: string, updates: Partial<TrainingSession>) => void
}

export function EditSessionDialog({ session, open, onOpenChange, onSave }: EditSessionDialogProps) {
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    useEffect(() => {
        if (session && open) {
            // Initialize form with session data
            setDate(format(session.date, "yyyy-MM-dd"))

            const [start, end] = session.time.split(" - ")
            setStartTime(start || "")
            setEndTime(end || "")
        }
    }, [session, open])

    if (!open || !session) return null

    const handleSave = () => {
        if (!date || !startTime || !endTime) return

        // Calculate duration
        const start = new Date(`2000-01-01T${startTime}`)
        const end = new Date(`2000-01-01T${endTime}`)
        const diffMs = end.getTime() - start.getTime()
        const diffHrs = diffMs / (1000 * 60 * 60)
        const duration = diffHrs + "h" // Simple formatting, e.g. "2h" or "2.5h"

        // Create new Date object from date string
        const newDate = new Date(date)

        // Construct updates
        const updates: Partial<TrainingSession> = {
            date: newDate,
            time: `${startTime} - ${endTime}`,
            duration: duration
        }

        onSave(session.id, updates)
        onOpenChange(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-card border-border shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Editar Sessão</h2>
                        <p className="text-sm text-muted-foreground">
                            Altere a data e horário da sessão.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-primary" /> Data
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> Início
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> Fim
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="gap-2">
                            <Save className="w-4 h-4" />
                            Guardar Alterações
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
