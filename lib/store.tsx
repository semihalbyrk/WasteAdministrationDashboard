"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Destination {
  id: string
  receiverId: string
  asn: string
  processingMethod: string
}

export interface WasteStream {
  wasteTypeId: string
  destinations: Destination[]
  defaultDestinationId: string
}

export interface Agreement {
  id: string
  disposerId: string
  servicePointId: string
  reportingSystem: "Basic System" | "Collector Scheme" | "Route Collection" | "Route Inzameling"
  validFrom: string
  validUntil: string
  senderId: string
  transporterId: string
  status: "Active" | "Inactive"
  wasteStreams: WasteStream[]
  createdAt: string
}

export interface WasteType {
  id: string
  name: string
  ewcCode: string
  hazardous: boolean
  description: string
}

const SEED_WASTE_TYPES: Omit<WasteType, "id">[] = [
  {
    name: "GFT (Groente-, Fruit- en Tuinafval)",
    ewcCode: "20 01 08",
    hazardous: false,
    description: "Organic waste from vegetables, fruit and garden",
  },
  {
    name: "OPK (Papier en Karton)",
    ewcCode: "20 01 01",
    hazardous: false,
    description: "Paper and cardboard waste",
  },
  {
    name: "PMD (Gemengde verpakkingen)",
    ewcCode: "15 01 06",
    hazardous: false,
    description: "Mixed packaging waste - plastic, metal, drink cartons",
  },
  {
    name: "Restafval",
    ewcCode: "20 03 01",
    hazardous: false,
    description: "Residual household waste",
  },
]

interface AppState {
  agreements: Agreement[]
  wasteTypes: WasteType[]
  addAgreement: (agreement: Omit<Agreement, "id" | "createdAt" | "status">) => Agreement
  updateAgreement: (id: string, agreement: Partial<Agreement>) => void
  deleteAgreement: (id: string) => void
  addWasteType: (wasteType: Omit<WasteType, "id">) => WasteType
  updateWasteType: (id: string, wasteType: Omit<WasteType, "id">) => void
  deleteWasteType: (id: string) => void
}

const STORAGE_KEY = "waste-app-data"

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          if (!data.wasteTypes || data.wasteTypes.length === 0) {
            data.wasteTypes = SEED_WASTE_TYPES.map((wt, idx) => ({
              ...wt,
              id: `wt-seed-${idx}`,
            }))
          }
          const hasRouteInzameling = data.agreements?.some((a: Agreement) => a.reportingSystem === "Route Inzameling")
          if (!hasRouteInzameling) {
            const pmdId = data.wasteTypes.find((wt: WasteType) => wt.name.includes("PMD"))?.id || "wt-seed-2"
            const opkId = data.wasteTypes.find((wt: WasteType) => wt.name.includes("OPK"))?.id || "wt-seed-1"
            const gftId = data.wasteTypes.find((wt: WasteType) => wt.name.includes("GFT"))?.id || "wt-seed-0"
            const restId = data.wasteTypes.find((wt: WasteType) => wt.name.includes("Restafval"))?.id || "wt-seed-3"

            const seedAgreement: Agreement = {
              id: "agr-seed-ri-1",
              disposerId: "rotterdam_municipality",
              senderId: "rotterdam_municipality",
              transporterId: "reinis_nv",
              servicePointId: "",
              reportingSystem: "Route Inzameling",
              validFrom: "2024-01-01",
              validUntil: "2026-12-31",
              status: "Active",
              wasteStreams: [
                {
                  wasteTypeId: pmdId,
                  destinations: [
                    { id: "dest-pmd-avr", receiverId: "avr", asn: "ASN-PMD-001", processingMethod: "Recycling" },
                    { id: "dest-pmd-renewi", receiverId: "renewi", asn: "ASN-PMD-002", processingMethod: "Sorting" },
                  ],
                  defaultDestinationId: "dest-pmd-avr",
                },
                {
                  wasteTypeId: opkId,
                  destinations: [
                    { id: "dest-opk-avr", receiverId: "avr", asn: "ASN-OPK-001", processingMethod: "Recycling" },
                  ],
                  defaultDestinationId: "dest-opk-avr",
                },
                {
                  wasteTypeId: gftId,
                  destinations: [
                    {
                      id: "dest-gft-indaver",
                      receiverId: "indaver",
                      asn: "ASN-GFT-001",
                      processingMethod: "Composting",
                    },
                  ],
                  defaultDestinationId: "dest-gft-indaver",
                },
                {
                  wasteTypeId: restId,
                  destinations: [
                    { id: "dest-rest-avr", receiverId: "avr", asn: "ASN-REST-001", processingMethod: "Incineration" },
                    {
                      id: "dest-rest-attero",
                      receiverId: "attero",
                      asn: "ASN-REST-002",
                      processingMethod: "Incineration",
                    },
                  ],
                  defaultDestinationId: "dest-rest-avr",
                },
              ],
              createdAt: new Date().toISOString(),
            }
            data.agreements = [...(data.agreements || []), seedAgreement]
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          setAgreements(data.agreements || [])
          setWasteTypes(data.wasteTypes || [])
        } catch (e) {
          console.error("Failed to parse stored data:", e)
          // Initialize with seed data
          const seededWasteTypes = SEED_WASTE_TYPES.map((wt, idx) => ({
            ...wt,
            id: `wt-seed-${idx}`,
          }))
          setWasteTypes(seededWasteTypes)
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ agreements: [], wasteTypes: seededWasteTypes }))
        }
      } else {
        // Initialize with seed data
        const seededWasteTypes = SEED_WASTE_TYPES.map((wt, idx) => ({
          ...wt,
          id: `wt-seed-${idx}`,
        }))
        setWasteTypes(seededWasteTypes)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ agreements: [], wasteTypes: seededWasteTypes }))
      }
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ agreements, wasteTypes }))
    }
  }, [agreements, wasteTypes, isInitialized])

  const addAgreement = (agreement: Omit<Agreement, "id" | "createdAt" | "status">) => {
    const newAgreement: Agreement = {
      ...agreement,
      id: `agr-${Date.now()}`,
      status: "Active",
      createdAt: new Date().toISOString(),
    }

    const currentData = localStorage.getItem(STORAGE_KEY)
    const parsed = currentData ? JSON.parse(currentData) : { agreements: [], wasteTypes: [] }
    parsed.agreements = [...parsed.agreements, newAgreement]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    setAgreements((prev) => [...prev, newAgreement])
    return newAgreement
  }

  const updateAgreement = (id: string, updates: Partial<Agreement>) => {
    const currentData = localStorage.getItem(STORAGE_KEY)
    const parsed = currentData ? JSON.parse(currentData) : { agreements: [], wasteTypes: [] }
    parsed.agreements = parsed.agreements.map((a: Agreement) => (a.id === id ? { ...a, ...updates } : a))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    setAgreements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }

  const deleteAgreement = (id: string) => {
    const currentData = localStorage.getItem(STORAGE_KEY)
    const parsed = currentData ? JSON.parse(currentData) : { agreements: [], wasteTypes: [] }
    parsed.agreements = parsed.agreements.filter((a: Agreement) => a.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    setAgreements((prev) => prev.filter((a) => a.id !== id))
  }

  const addWasteType = (wasteType: Omit<WasteType, "id">) => {
    const newWasteType: WasteType = {
      ...wasteType,
      id: `wt-${Date.now()}`,
    }

    const currentData = localStorage.getItem(STORAGE_KEY)
    const parsed = currentData ? JSON.parse(currentData) : { agreements: [], wasteTypes: [] }
    parsed.wasteTypes = [...parsed.wasteTypes, newWasteType]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    setWasteTypes((prev) => [...prev, newWasteType])
    return newWasteType
  }

  const updateWasteType = (id: string, wasteType: Omit<WasteType, "id">) => {
    const currentData = localStorage.getItem(STORAGE_KEY)
    const parsed = currentData ? JSON.parse(currentData) : { agreements: [], wasteTypes: [] }
    parsed.wasteTypes = parsed.wasteTypes.map((wt: WasteType) => (wt.id === id ? { ...wt, ...wasteType } : wt))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    setWasteTypes((prev) => prev.map((wt) => (wt.id === id ? { ...wt, ...wasteType } : wt)))
  }

  const deleteWasteType = (id: string) => {
    const currentData = localStorage.getItem(STORAGE_KEY)
    const parsed = currentData ? JSON.parse(currentData) : { agreements: [], wasteTypes: [] }
    parsed.wasteTypes = parsed.wasteTypes.filter((wt: WasteType) => wt.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

    setWasteTypes((prev) => prev.filter((wt) => wt.id !== id))
  }

  return (
    <AppContext.Provider
      value={{
        agreements,
        wasteTypes,
        addAgreement,
        updateAgreement,
        deleteAgreement,
        addWasteType,
        updateWasteType,
        deleteWasteType,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
