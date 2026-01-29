"use client"

import { TrainingCalendar } from "@/components/training-calendar"
import { WorkloadAnalytics } from "@/components/workload-analytics"
import { WorkloadDetails } from "@/components/workload-details"
import { useTraining } from "@/context/training-context"
import { LoginForm } from "@/components/login-form"

function AppContent() {
  const { isAuthenticated } = useTraining()

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="w-full px-4 lg:px-6 py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          Calendário Ivo
        </h1>
        <p className="text-muted-foreground">
          Gestão de treinos e análise financeira
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrainingCalendar />
        </div>
        <div className="lg:col-span-1">
          <WorkloadAnalytics />
        </div>
        <div className="lg:col-span-1">
          <WorkloadDetails />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <AppContent />
}
