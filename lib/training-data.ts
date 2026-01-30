export interface TrainingSession {
  id: string
  date: Date
  time: string
  duration: string
  trainingId: string
  validated?: boolean
}

export interface FinancialAdjustment {
  id: string
  description: string
  value: number // Can be positive or negative
  date: Date
}

export interface Training {
  id: string
  name: string
  instructor: string
  totalSessions: number
  schedule: string
  color: string
  hourlyRate: number
  extraValue?: number // For one-time payments or extras
  sessions: TrainingSession[]
}

// Helper to create date in 2026
function d(month: number, day: number): Date {
  return new Date(2026, month - 1, day)
}

const rawTrainings: (Omit<Training, "sessions"> & { sessions: Omit<TrainingSession, "id">[] })[] = [
  // Formação 0 - Margarida (9 sessões restantes, próxima 2 Fev, Seg/Qua 15h-17h)
  // Dia 16 Fev livre - sessão movida para frente
  {
    id: "formacao-0",
    name: "Formação Margarida",
    instructor: "Margarida",
    totalSessions: 9,
    schedule: "Seg. e Quartas 15h às 17h",
    color: "bg-emerald-500",
    hourlyRate: 35,
    sessions: [
      // 9 sessions starting Feb 2, Mon/Wed 15h-17h (skipping Feb 16)
      { date: d(2, 2), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(2, 4), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(2, 9), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(2, 11), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      // Skip Feb 16
      { date: d(2, 18), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(2, 23), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(2, 25), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(3, 2), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
      { date: d(3, 4), time: "15:00 - 17:00", duration: "2h", trainingId: "formacao-0" },
    ]
  },
  // Formação 1 - Samuel (9 sessões restantes, próxima 30 Jan, Qua/Sex 10:30h-12:30h)
  // Dia 20 Fev livre - sessão movida para frente
  {
    id: "formacao-1",
    name: "Formação Samuel",
    instructor: "Samuel",
    totalSessions: 9,
    schedule: "Quarta e Sexta 10:30h às 12:30h",
    color: "bg-blue-500",
    hourlyRate: 35,
    sessions: [
      // 9 sessions starting Jan 30, Wed/Fri 10:30h-12:30h (skipping Feb 20)
      { date: d(1, 30), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(2, 4), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(2, 6), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(2, 11), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(2, 13), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(2, 18), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      // Skip Feb 20
      { date: d(2, 25), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(2, 27), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
      { date: d(3, 4), time: "10:30 - 12:30", duration: "2h", trainingId: "formacao-1" },
    ]
  },
  // Formação 2 - Frato (6 sessões restantes, próxima 3 Fev, última 24 Fev)
  // Dia 19 Fev livre
  {
    id: "formacao-2",
    name: "Formação Frato",
    instructor: "Frato",
    totalSessions: 6,
    schedule: "Terça e Quinta 13:30h às 17:30h",
    color: "bg-orange-500",
    hourlyRate: 65,
    extraValue: 400, // +400€ extra
    sessions: [
      // 6 sessions, Tue/Thu 13:30h-17:30h, Feb 3 to Feb 24 (skipping Feb 19)
      { date: d(2, 3), time: "13:30 - 17:30", duration: "4h", trainingId: "formacao-2" },
      { date: d(2, 5), time: "13:30 - 17:30", duration: "4h", trainingId: "formacao-2" },
      { date: d(2, 10), time: "13:30 - 17:30", duration: "4h", trainingId: "formacao-2" },
      { date: d(2, 12), time: "13:30 - 17:30", duration: "4h", trainingId: "formacao-2" },
      { date: d(2, 17), time: "13:30 - 17:30", duration: "4h", trainingId: "formacao-2" },
      // Skip Feb 19
      { date: d(2, 24), time: "13:30 - 17:30", duration: "4h", trainingId: "formacao-2" },
    ]
  },
  // Projeto CIN - Pagamento em atraso
  {
    id: "projeto-cin",
    name: "Projeto CIN (Atraso)",
    instructor: "CIN",
    totalSessions: 1,
    schedule: "Pagamento único",
    color: "bg-red-500",
    hourlyRate: 0,
    extraValue: 500, // +500€ pagamento em atraso
    sessions: [
      { date: d(2, 1), time: "09:00 - 10:00", duration: "1h", trainingId: "projeto-cin" }
    ]
  },
  // Defesa Título Especialista
  {
    id: "defesa-titulo",
    name: "Defesa Título Especialista",
    instructor: "Júri",
    totalSessions: 1,
    schedule: "Data Marcada",
    color: "bg-purple-600",
    hourlyRate: 0,
    sessions: [
      { date: d(2, 20), time: "09:00 - 18:00", duration: "9h", trainingId: "defesa-titulo" }
    ]
  },
  // Formação 4 - Módulos (Twinmotion, V-Ray, etc.)
  {
    id: "formacao-4",
    name: "Módulos Visualização 3D",
    instructor: "Vários",
    totalSessions: 16,
    schedule: "10h às 12h (vários dias)",
    color: "bg-pink-500",
    hourlyRate: 50,
    sessions: [
      // MÓDULO A1: Twinmotion - Iniciação e Imersão
      { date: d(2, 24), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(2, 26), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 3), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 5), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      // MÓDULO A2: Twinmotion - Video e Interatividade
      { date: d(3, 10), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 13), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 17), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 19), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      // MÓDULO A3: V-Ray Vantage - Fotorrealismo
      { date: d(3, 24), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 26), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(3, 31), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(4, 2), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      // MÓDULO A4: Pós-Produção e Fluxo de Trabalho
      { date: d(4, 7), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(4, 9), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(4, 14), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
      { date: d(4, 16), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-4" },
    ]
  },
  // Formação Susana - 20 sessões, 40h total, Seg e Qua, início 11 Março
  {
    id: "formacao-susana",
    name: "Formação Susana",
    instructor: "Susana",
    totalSessions: 20,
    schedule: "Seg. e Quartas (2h/sessão)",
    color: "bg-lime-500",
    hourlyRate: 35,
    sessions: [
      // Starting March 11 (Wednesday), Mon/Wed, 20 sessions
      { date: d(3, 11), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(3, 16), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(3, 18), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(3, 23), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(3, 25), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(3, 30), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 1), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 6), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 8), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 13), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 15), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 20), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 22), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 27), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(4, 29), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(5, 4), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(5, 6), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(5, 11), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(5, 13), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
      { date: d(5, 18), time: "10:00 - 12:00", duration: "2h", trainingId: "formacao-susana" },
    ]
  },
  // From image - Visualização com IA para Arquitetos (Edition 1)
  // Sessions 16, 19, 20 moved forward - now starting March 24
  {
    id: "viz-ia-arq-1",
    name: "Visualização com IA para Arquitetos",
    instructor: "Tatiana Nogueira",
    totalSessions: 6,
    schedule: "3as e 5as 18h30-20h30, Sábados 10h-13h",
    color: "bg-cyan-500",
    hourlyRate: 50,
    sessions: [
      { date: d(3, 24), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-1" },
      { date: d(3, 26), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-1" },
      { date: d(3, 28), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-1" },
      { date: d(3, 31), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-1" },
      { date: d(4, 2), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-1" },
      { date: d(4, 4), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-1" },
    ]
  },
  // From image - Formação Avançada IA Multimodal (Edition 1)
  {
    id: "ia-multimodal-1",
    name: "Formação Avançada IA Multimodal",
    instructor: "Susana Silva",
    totalSessions: 8,
    schedule: "3as e 6as 18h30-20h30, Sábados 10h30-12h30",
    color: "bg-amber-500",
    hourlyRate: 55,
    sessions: [
      { date: d(5, 12), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 15), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 16), time: "10:30 - 12:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 19), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 22), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 23), time: "10:30 - 12:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 26), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-1" },
      { date: d(5, 28), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-1" },
    ]
  },
  // From image - Visualização com IA para Arquitetos (Edition 2)
  {
    id: "viz-ia-arq-2",
    name: "Visualização com IA para Arquitetos Ed.2",
    instructor: "Catarina Barradas",
    totalSessions: 6,
    schedule: "3as e 5as 18h30-20h30, Sábados 10h-13h",
    color: "bg-teal-500",
    hourlyRate: 50,
    sessions: [
      { date: d(6, 16), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-2" },
      { date: d(6, 18), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-2" },
      { date: d(6, 20), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-2" },
      { date: d(6, 25), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-2" },
      { date: d(6, 27), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-2" },
      { date: d(6, 30), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-2" },
    ]
  },
  // From image - Visualização com IA para Arquitetos (Edition 3)
  {
    id: "viz-ia-arq-3",
    name: "Visualização com IA para Arquitetos Ed.3",
    instructor: "Tatiana Nogueira",
    totalSessions: 6,
    schedule: "3as e 5as 18h30-20h30, Sábados 10h-13h",
    color: "bg-indigo-500",
    hourlyRate: 50,
    sessions: [
      { date: d(9, 10), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-3" },
      { date: d(9, 12), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-3" },
      { date: d(9, 15), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-3" },
      { date: d(9, 17), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-3" },
      { date: d(9, 19), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-3" },
      { date: d(9, 22), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-3" },
    ]
  },
  // From image - Formação Avançada IA Multimodal (Edition 2)
  {
    id: "ia-multimodal-2",
    name: "Formação Avançada IA Multimodal Ed.2",
    instructor: "Catarina Barradas",
    totalSessions: 8,
    schedule: "3as e 6as 18h30-20h30, Sábados 10h30-12h30",
    color: "bg-rose-500",
    hourlyRate: 55,
    sessions: [
      { date: d(10, 13), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 16), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 17), time: "10:30 - 12:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 20), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 23), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 24), time: "10:30 - 12:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 27), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-2" },
      { date: d(10, 29), time: "18:30 - 20:30", duration: "2h", trainingId: "ia-multimodal-2" },
    ]
  },
  // From image - Visualização com IA para Arquitetos (Edition 4)
  {
    id: "viz-ia-arq-4",
    name: "Visualização com IA para Arquitetos Ed.4",
    instructor: "Catarina Barradas",
    totalSessions: 6,
    schedule: "3as e 5as 18h30-20h30, Sábados 10h-13h",
    color: "bg-violet-500",
    hourlyRate: 50,
    sessions: [
      { date: d(12, 3), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-4" },
      { date: d(12, 5), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-4" },
      { date: d(12, 10), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-4" },
      { date: d(12, 12), time: "10:00 - 13:00", duration: "3h", trainingId: "viz-ia-arq-4" },
      { date: d(12, 15), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-4" },
      { date: d(12, 17), time: "18:30 - 20:30", duration: "2h", trainingId: "viz-ia-arq-4" },
    ]
  },
]

// Add IDs to sessions programmatically
export const trainings: Training[] = rawTrainings.map(t => ({
  ...t,
  sessions: t.sessions.map((s, i) => ({
    ...s,
    id: `${t.id}-s${i}`
  }))
}))

export const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
