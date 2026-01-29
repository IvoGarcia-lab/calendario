"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { trainings as initialData, type Training, type TrainingSession } from "@/lib/training-data"

interface TrainingContextType {
    trainings: Training[]
    addTraining: (training: Training) => void
    updateTraining: (id: string, updates: Partial<Training>) => void
    addSession: (trainingId: string, session: TrainingSession) => void
    updateSession: (trainingId: string, sessionId: string, updates: Partial<TrainingSession>) => void
    deleteSession: (trainingId: string, sessionId: string) => void
    resetData: () => void
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined)

export function TrainingProvider({ children }: { children: React.ReactNode }) {
    const [trainings, setTrainings] = useState<Training[]>(initialData)
    const [isInitialized, setIsInitialized] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("training-data-v1")
        if (saved) {
            try {
                // Need to convert date strings back to Date objects
                const parsed = JSON.parse(saved)
                const hydrated = parsed.map((t: any) => ({
                    ...t,
                    sessions: t.sessions.map((s: any) => ({
                        ...s,
                        date: new Date(s.date),
                        // Ensure dayDate is also restored if it exists, or derived
                        dayDate: s.dayDate ? new Date(s.dayDate) : new Date(s.date)
                    }))
                }))
                setTrainings(hydrated)
            } catch (e) {
                console.error("Failed to parse saved trainings", e)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("training-data-v1", JSON.stringify(trainings))
        }
    }, [trainings, isInitialized])

    const addTraining = (training: Training) => {
        setTrainings(prev => [...prev, training])
    }

    const updateTraining = (id: string, updates: Partial<Training>) => {
        setTrainings(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ))
    }

    const addSession = (trainingId: string, session: TrainingSession) => {
        setTrainings(prev => prev.map(t => {
            if (t.id !== trainingId) return t
            return { ...t, sessions: [...t.sessions, session] }
        }))
    }

    const updateSession = (trainingId: string, sessionId: string, updates: Partial<TrainingSession>) => {
        setTrainings(prev => prev.map(t => {
            if (t.id !== trainingId) return t
            return {
                ...t,
                sessions: t.sessions.map(s =>
                    s.id === sessionId ? { ...s, ...updates } : s
                )
            }
        }))
    }

    const deleteSession = (trainingId: string, sessionId: string) => {
        setTrainings(prev => prev.map(t => {
            if (t.id !== trainingId) return t
            return {
                ...t,
                sessions: t.sessions.filter(s => s.id !== sessionId)
            }
        }))
    }

    const resetData = () => {
        setTrainings(initialData)
        localStorage.removeItem("training-data-v1")
    }

    return (
        <TrainingContext.Provider value={{
            trainings,
            addTraining,
            updateTraining,
            addSession,
            updateSession,
            deleteSession,
            resetData
        }}>
            {children}
        </TrainingContext.Provider>
    )
}

export function useTraining() {
    const context = useContext(TrainingContext)
    if (context === undefined) {
        throw new Error("useTraining must be used within a TrainingProvider")
    }
    return context
}
