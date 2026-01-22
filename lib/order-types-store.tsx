"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type WasteTypeSelection = "none" | "single" | "multiple"
export type ComplianceModule = "none" | "nl_lma" | "global"
export type LMAReportingMethod = "basic_system" | "collectors_schema" | "route_collection"

export interface OrderType {
  id: string
  name: string
  description?: string
  wasteTypeSelection: WasteTypeSelection
  complianceModule: ComplianceModule
  lmaReportingMethod: LMAReportingMethod | null
}

interface OrderTypesState {
  orderTypes: OrderType[]
  addOrderType: (orderType: Omit<OrderType, "id">) => OrderType
  updateOrderType: (id: string, orderType: Omit<OrderType, "id">) => void
  deleteOrderType: (id: string) => void
}

const STORAGE_KEY = "waste-app-order-types"

const OrderTypesContext = createContext<OrderTypesState | undefined>(undefined)

export function OrderTypesProvider({ children }: { children: ReactNode }) {
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          setOrderTypes(data)
        } catch (e) {
          console.error("Failed to parse stored order types:", e)
          setOrderTypes([])
        }
      }
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderTypes))
    }
  }, [orderTypes, isInitialized])

  const addOrderType = (orderType: Omit<OrderType, "id">) => {
    const newOrderType: OrderType = {
      ...orderType,
      id: `ot-${Date.now()}`,
    }
    setOrderTypes((prev) => [...prev, newOrderType])
    return newOrderType
  }

  const updateOrderType = (id: string, orderType: Omit<OrderType, "id">) => {
    setOrderTypes((prev) => prev.map((ot) => (ot.id === id ? { ...ot, ...orderType } : ot)))
  }

  const deleteOrderType = (id: string) => {
    setOrderTypes((prev) => prev.filter((ot) => ot.id !== id))
  }

  return (
    <OrderTypesContext.Provider
      value={{
        orderTypes,
        addOrderType,
        updateOrderType,
        deleteOrderType,
      }}
    >
      {children}
    </OrderTypesContext.Provider>
  )
}

export function useOrderTypes() {
  const context = useContext(OrderTypesContext)
  if (context === undefined) {
    throw new Error("useOrderTypes must be used within an OrderTypesProvider")
  }
  return context
}

export function getLMAReportingMethodName(method: LMAReportingMethod | null): string {
  if (!method) return "-"

  const names: Record<LMAReportingMethod, string> = {
    basic_system: "Basic System (Basissystematiek)",
    collectors_schema: "Collectors Schema (Inzamelaarsregeling)",
    route_collection: "Route Collection (Route-inzameling)",
  }

  return names[method] || method
}

export function getComplianceModuleName(module: ComplianceModule): string {
  const names: Record<ComplianceModule, string> = {
    none: "None (Default)",
    nl_lma: "Netherlands – LMA",
    global: "Global",
  }

  return names[module] || module
}
