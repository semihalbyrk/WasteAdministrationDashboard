"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const STORAGE_KEY = "evreka_tasks_v1"

export type TaskStatus = "Te Doen" | "In Uitvoering" | "Voltooid"

export interface Task {
  id: string
  orderId: string
  orderName: string
  orderType: string
  operation: string
  taskTemplate: string
  operationDate: string
  dueDate: string
  status: TaskStatus
  servicePoint?: string
  shift?: string
  timeWindow?: string
  note?: string
  location?: { lat: number; lng: number }
  createdAt: string
  updatedAt: string
}

interface TasksState {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTaskById: (id: string) => Task | undefined
  getTasksByOrderId: (orderId: string) => Task[]
  isInitialized: boolean
}

const TasksContext = createContext<TasksState | undefined>(undefined)

function loadFromStorage(): Task[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  } catch {
    return []
  }
}

function saveToStorage(tasks: Task[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    console.error("Failed to save tasks:", error)
  }
}

// Seed data
const SEED_TASKS: Task[] = [
  {
    id: "23247747",
    orderId: "ORD-000184",
    orderName: "Order #184",
    orderType: "Aftransport",
    operation: "Aftransport",
    taskTemplate: "Aftransport",
    operationDate: "2025-12-01",
    dueDate: "2025-12-01",
    status: "Te Doen",
    servicePoint: "-",
    shift: "-",
    timeWindow: "-",
    note: "-",
    location: { lat: 51.862832, lng: 4.238292 },
    createdAt: "2025-12-01T08:52:00.000Z",
    updatedAt: "2025-12-01T08:52:00.000Z",
  },
]

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const loaded = loadFromStorage()
    if (loaded.length === 0) {
      // Seed with initial data
      saveToStorage(SEED_TASKS)
      setTasks(SEED_TASKS)
    } else {
      setTasks(loaded)
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized && tasks.length > 0) {
      saveToStorage(tasks)
    }
  }, [tasks, isInitialized])

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const newTask: Task = {
      ...task,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const currentTasks = loadFromStorage()
    const updatedTasks = [newTask, ...currentTasks]
    saveToStorage(updatedTasks)
    setTasks(updatedTasks)
    return newTask
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : t,
      )
      saveToStorage(updated)
      return updated
    })
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const getTaskById = useCallback(
    (id: string) => {
      const fromState = tasks.find((t) => t.id === id)
      if (fromState) return fromState
      const fromStorage = loadFromStorage()
      return fromStorage.find((t) => t.id === id)
    },
    [tasks],
  )

  const getTasksByOrderId = useCallback(
    (orderId: string) => {
      return tasks.filter((t) => t.orderId === orderId)
    },
    [tasks],
  )

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        getTaskById,
        getTasksByOrderId,
        isInitialized,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider")
  }
  return context
}
