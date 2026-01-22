"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const STORAGE_KEY = "evreka_orders_v1"

export type OrderStatus = "Draft" | "Submitted"

export interface WasteLine {
  id: string
  wasteTypeId: string
  disposerId: string
  receiverId: string
  asn: string
  processingMethod: string
  afasRomNumber?: string
  senderId: string
  transporterId: string
}

export interface Order {
  id: string
  entityId: string
  servicePointId: string
  orderTypeId: string
  fulfillmentDate: string
  orderName: string
  status: OrderStatus
  wasteLines: WasteLine[]
  agreementTransporterEntityId: string
  useOutsourcedCarrier: boolean
  outsourcedCarrierEntityId?: string
  createdAt: string
  updatedAt: string
  location?: { lat: number; lng: number }
  note?: string
}

interface OrdersState {
  orders: Order[]
  addOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">) => Order
  updateOrder: (id: string, updates: Partial<Order>) => void
  deleteOrder: (id: string) => void
  getOrderById: (id: string) => Order | undefined
  isInitialized: boolean
}

const OrdersContext = createContext<OrdersState | undefined>(undefined)

function loadFromStorage(): Order[] {
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

function saveToStorage(orders: Order[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch (error) {
    console.error("Failed to save orders:", error)
  }
}

const SEED_ORDERS: Order[] = [
  {
    id: "ORD-000184",
    entityId: "reinis_nv",
    servicePointId: "",
    orderTypeId: "aftransport",
    fulfillmentDate: "2025-12-01",
    orderName: "Order #184",
    status: "Draft",
    wasteLines: [
      {
        id: "wl-1",
        wasteTypeId: "gft",
        disposerId: "reinis_nv",
        receiverId: "avr_rotterdam",
        asn: "AVR1234567",
        processingMethod: "Composting",
        senderId: "reinis_nv",
        transporterId: "renewi_rotterdam",
      },
    ],
    agreementTransporterEntityId: "renewi_rotterdam",
    useOutsourcedCarrier: false,
    location: { lat: 51.862832, lng: 4.238292 },
    note: "-",
    createdAt: "2025-12-01T08:52:00.000Z",
    updatedAt: "2025-12-01T08:52:00.000Z",
  },
]

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const loaded = loadFromStorage()
    if (loaded.length === 0) {
      saveToStorage(SEED_ORDERS)
      setOrders(SEED_ORDERS)
    } else {
      setOrders(loaded)
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized && orders.length > 0) {
      saveToStorage(orders)
    }
  }, [orders, isInitialized])

  const addOrder = useCallback((order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${String(Date.now()).slice(-6)}`,
      status: "Submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const currentOrders = loadFromStorage()
    const updatedOrders = [newOrder, ...currentOrders]
    saveToStorage(updatedOrders)
    setOrders(updatedOrders)
    return newOrder
  }, [])

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === id
          ? {
              ...o,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : o,
      )
      saveToStorage(updated)
      return updated
    })
  }, [])

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const getOrderById = useCallback(
    (id: string) => {
      const fromState = orders.find((o) => o.id === id)
      if (fromState) return fromState
      const fromStorage = loadFromStorage()
      return fromStorage.find((o) => o.id === id)
    },
    [orders],
  )

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        getOrderById,
        isInitialized,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return context
}
