"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { trainings as initialData, type Training, type TrainingSession, type FinancialAdjustment } from "@/lib/training-data"

interface TrainingContextType {
    trainings: Training[]
    adjustments: FinancialAdjustment[]
    taxRetentionRate: number // Percentage (e.g., 25)
    isAuthenticated: boolean
    // Analysis State
    analysisMode: 'month' | 'custom'
    customStart: string
    customEnd: string
    viewedDate: Date
    periodRange: { start: Date; end: Date; type?: 'month' | 'custom' }

    setAnalysisMode: (mode: 'month' | 'custom') => void
    setCustomStart: (date: string) => void
    setCustomEnd: (date: string) => void
    setViewedDate: (date: Date) => void

    login: (u: string, p: string) => boolean
    logout: () => void
    addTraining: (training: Training) => void
    updateTraining: (id: string, updates: Partial<Training>) => void
    addSession: (trainingId: string, session: TrainingSession) => void
    updateSession: (trainingId: string, sessionId: string, updates: Partial<TrainingSession>) => void
    deleteSession: (trainingId: string, sessionId: string) => void
    deleteTraining: (id: string) => void
    validateSession: (trainingId: string, sessionId: string, validated: boolean) => void
    addAdjustment: (adjustment: FinancialAdjustment) => void
    deleteAdjustment: (id: string) => void
    setTaxRetentionRate: (rate: number) => void
    resetData: () => void
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined)

export function TrainingProvider({ children }: { children: React.ReactNode }) {
    const [trainings, setTrainings] = useState<Training[]>(initialData)
    const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([])
    const [taxRetentionRate, setTaxRetentionRate] = useState(25) // Default 25%
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Analysis State
    const [analysisMode, setAnalysisMode] = useState<'month' | 'custom'>('month')
    const [customStart, setCustomStart] = useState<string>(new Date().toISOString().slice(0, 7))
    const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().slice(0, 7))
    const [viewedDate, setViewedDate] = useState<Date>(new Date())

    // Computed Period Range
    const periodRange = React.useMemo(() => {
        if (analysisMode === 'month') {
            const start = new Date(viewedDate.getFullYear(), viewedDate.getMonth(), 1)
            const end = new Date(viewedDate.getFullYear(), viewedDate.getMonth() + 1, 0, 23, 59, 59)
            return { start, end, type: 'month' as const }
        } else {
            const [startYear, startMonth] = customStart.split('-').map(Number)
            const [endYear, endMonth] = customEnd.split('-').map(Number)
            const start = new Date(startYear, startMonth - 1, 1)
            // End of the end month
            const end = new Date(endYear, endMonth, 0, 23, 59, 59)
            return { start, end, type: 'custom' as const }
        }
    }, [analysisMode, customStart, customEnd, viewedDate])

    // Load state from localStorage on mount
    useEffect(() => {
        // Auth check
        const auth = localStorage.getItem("calendario-ivo-auth")
        if (auth === "true") {
            setIsAuthenticated(true)
        }

        // Data check
        const savedData = localStorage.getItem("training-data-v1")
        const savedAdjustments = localStorage.getItem("training-adjustments-v1")
        const savedTax = localStorage.getItem("training-tax-rate-v1")

        // Analysis Settings
        const savedAnalysis = localStorage.getItem("training-analysis-v1")

        if (savedData) {
            try {
                // Need to convert date strings back to Date objects
                const parsed = JSON.parse(savedData)
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

        if (savedAdjustments) {
            try {
                const parsed = JSON.parse(savedAdjustments)
                setAdjustments(parsed.map((a: any) => ({ ...a, date: new Date(a.date) })))
            } catch (e) { console.error("Failed to parse adjustments", e) }
        }

        if (savedTax) {
            setTaxRetentionRate(parseFloat(savedTax))
        }

        if (savedAnalysis) {
            try {
                const parsed = JSON.parse(savedAnalysis)
                if (parsed.mode) setAnalysisMode(parsed.mode)
                if (parsed.start) setCustomStart(parsed.start)
                if (parsed.end) setCustomEnd(parsed.end)
            } catch (e) {
                console.error("Failed to parse analysis settings", e)
            }
        }

        setIsInitialized(true)
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("training-data-v1", JSON.stringify(trainings))
            localStorage.setItem("training-adjustments-v1", JSON.stringify(adjustments))
            localStorage.setItem("training-tax-rate-v1", taxRetentionRate.toString())
            localStorage.setItem("training-analysis-v1", JSON.stringify({
                mode: analysisMode,
                start: customStart,
                end: customEnd
            }))
        }
    }, [trainings, adjustments, taxRetentionRate, analysisMode, customStart, customEnd, isInitialized])

    const login = (u: string, p: string) => {
        // Tolerant check: trim whitespace and allow case-insensitive username
        if (u.trim().toLowerCase() === "ivogarcia" && p.trim() === "Arte2003@") {
            setIsAuthenticated(true)
            localStorage.setItem("calendario-ivo-auth", "true")
            return true
        }
        return false
    }

    const logout = () => {
        setIsAuthenticated(false)
        localStorage.removeItem("calendario-ivo-auth")
    }

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

    const deleteTraining = (id: string) => {
        setTrainings(prev => prev.filter(t => t.id !== id))
    }

    const validateSession = (trainingId: string, sessionId: string, validated: boolean) => {
        setTrainings(prev => prev.map(t => {
            if (t.id !== trainingId) return t
            return {
                ...t,
                sessions: t.sessions.map(s =>
                    s.id === sessionId ? { ...s, validated } : s
                )
            }
        }))
    }

    const addAdjustment = (adjustment: FinancialAdjustment) => {
        setAdjustments(prev => [...prev, adjustment])
    }

    const deleteAdjustment = (id: string) => {
        setAdjustments(prev => prev.filter(a => a.id !== id))
    }

    const resetData = () => {
        setTrainings(initialData)
        setAdjustments([])
        setTaxRetentionRate(25)
        setAnalysisMode('month')
        setCustomStart(new Date().toISOString().slice(0, 7))
        setCustomEnd(new Date().toISOString().slice(0, 7))
        localStorage.removeItem("training-data-v1")
        localStorage.removeItem("training-adjustments-v1")
        localStorage.removeItem("training-tax-rate-v1")
        localStorage.removeItem("training-analysis-v1")
    }

    return (
        <TrainingContext.Provider value={{
            trainings,
            adjustments,
            taxRetentionRate,
            isAuthenticated,
            analysisMode,
            customStart,
            customEnd,
            viewedDate,
            periodRange,

            setAnalysisMode,
            setCustomStart,
            setCustomEnd,
            setViewedDate,
            login,
            logout,
            addTraining,
            updateTraining,
            addSession,
            updateSession,
            deleteSession,
            deleteTraining,
            validateSession,
            addAdjustment,
            deleteAdjustment,
            setTaxRetentionRate,
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
