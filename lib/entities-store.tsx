"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type EntityRole = "Sender" | "Disposer" | "Transporter" | "Receiver"
export type EntityType = "Customer" | "Supplier" | "Partner" | "Internal Branch"
export type SenderLegalRole = "Ontdoener" | "Ontvanger" | "Handelaar" | "Bemiddelaar"
export type TransporterFleetSource = "Internal" | "External"
export type TransporterLegalCapability = "Inzamelaars" | "Vervoerder"
export type ReceiverFacilityType = "Processor" | "Transfer Station" | "Sorting Facility" | "Storage"

export interface ServicePoint {
  id: string
  name: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
}

export interface SenderConfig {
  legalRoles: SenderLegalRole[]
}

export interface TransporterConfig {
  fleetSource: TransporterFleetSource
  legalCapabilities: TransporterLegalCapability[]
  internationalTransport: boolean
  eurovergunning?: string
}

export interface ReceiverConfig {
  lmaReportingObligated: boolean
  processorNumber?: string
  allowedWasteTypeIds: string[]
  facilityType?: ReceiverFacilityType
}

export interface Entity {
  id: string
  name: string
  entityType: EntityType
  isTenant: boolean
  isDefaultInternalCollector: boolean
  // Address
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  // Registry
  kvkNumber: string
  vihbNumber?: string
  // Roles
  roles: EntityRole[]
  senderConfig?: SenderConfig
  transporterConfig?: TransporterConfig
  receiverConfig?: ReceiverConfig
  // Service Points
  servicePoints: ServicePoint[]
  createdAt: string
}

const SEED_ENTITIES: Omit<Entity, "id" | "createdAt">[] = [
  {
    name: "Reinis N.V.",
    entityType: "Internal Branch",
    isTenant: true,
    isDefaultInternalCollector: true,
    street: "Waalhaven Oostzijde",
    houseNumber: "12",
    postalCode: "3087 AM",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24123456",
    vihbNumber: "VIHB-001234",
    roles: ["Sender", "Disposer", "Transporter"],
    senderConfig: { legalRoles: ["Ontdoener", "Handelaar"] },
    transporterConfig: {
      fleetSource: "Internal",
      legalCapabilities: ["Inzamelaars", "Vervoerder"],
      internationalTransport: false,
    },
    servicePoints: [],
  },
  {
    name: "Erasmus MC (Rotterdam)",
    entityType: "Customer",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Doctor Molewaterplein",
    houseNumber: "40",
    postalCode: "3015 GD",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24890123",
    roles: ["Sender", "Disposer"],
    senderConfig: { legalRoles: ["Ontdoener"] },
    servicePoints: [
      {
        id: "erasmus_waste_dock",
        name: "Erasmus MC – Waste Dock",
        street: "Wytemaweg",
        houseNumber: "80",
        postalCode: "3015 CN",
        city: "Rotterdam",
      },
      {
        id: "erasmus_pharmacy_labs",
        name: "Erasmus MC – Pharmacy & Labs",
        street: "Doctor Molewaterplein",
        houseNumber: "50",
        postalCode: "3015 GD",
        city: "Rotterdam",
      },
    ],
  },
  {
    name: "Maasstad Ziekenhuis (Rotterdam)",
    entityType: "Customer",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Maasstadweg",
    houseNumber: "21",
    postalCode: "3079 DZ",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24891234",
    roles: ["Disposer"],
    servicePoints: [
      {
        id: "maasstad_service_yard",
        name: "Maasstad – Service Yard",
        street: "Maasstadweg",
        houseNumber: "25",
        postalCode: "3079 DZ",
        city: "Rotterdam",
      },
    ],
  },
  {
    name: "Port of Rotterdam Authority",
    entityType: "Customer",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Wilhelminakade",
    houseNumber: "909",
    postalCode: "3072 AP",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24892345",
    roles: ["Sender", "Disposer"],
    senderConfig: { legalRoles: ["Ontdoener"] },
    servicePoints: [
      {
        id: "maasvlakte_gate_a",
        name: "Maasvlakte – Gate A",
        street: "Maasvlakteweg",
        houseNumber: "1",
        postalCode: "3199 LZ",
        city: "Rotterdam",
      },
      {
        id: "waalhaven_yard_3",
        name: "Waalhaven – Yard 3",
        street: "Waalhaven Zuidzijde",
        houseNumber: "3",
        postalCode: "3089 JH",
        city: "Rotterdam",
      },
    ],
  },
  {
    name: "Municipality of Rotterdam",
    entityType: "Customer",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Coolsingel",
    houseNumber: "40",
    postalCode: "3011 AD",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24234567",
    roles: ["Sender", "Disposer"],
    senderConfig: { legalRoles: ["Ontdoener"] },
    servicePoints: [
      {
        id: "municipal_transfer_zuid",
        name: "Municipal Transfer Station Zuid",
        street: "Schiehaven",
        houseNumber: "50",
        postalCode: "3024 EC",
        city: "Rotterdam",
      },
      {
        id: "municipal_depot_noord",
        name: "Municipal Depot Noord",
        street: "Overschieseweg",
        houseNumber: "10",
        postalCode: "3044 EE",
        city: "Rotterdam",
      },
    ],
  },
  {
    name: "Bouwcom Rotterdam BV (Construction)",
    entityType: "Customer",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Maasboulevard",
    houseNumber: "100",
    postalCode: "3063 NS",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24345678",
    roles: ["Sender", "Disposer"],
    senderConfig: { legalRoles: ["Ontdoener"] },
    servicePoints: [
      {
        id: "bouwcom_keileweg",
        name: "Bouwcom – Site Keileweg",
        street: "Keileweg",
        houseNumber: "15",
        postalCode: "3029 BS",
        city: "Rotterdam",
      },
      {
        id: "bouwcom_europoort",
        name: "Bouwcom – Site Europoort",
        street: "Europaweg",
        houseNumber: "200",
        postalCode: "3198 LD",
        city: "Rotterdam",
      },
    ],
  },
  {
    name: "Renewi (Rotterdam)",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Botlekweg",
    houseNumber: "5",
    postalCode: "3197 KB",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24456789",
    vihbNumber: "VIHB-987654",
    roles: ["Transporter", "Receiver"],
    transporterConfig: { fleetSource: "External", legalCapabilities: ["Vervoerder"], internationalTransport: false },
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Transfer Station" },
    servicePoints: [],
  },
  {
    name: "AVR Afvalverwerking (Rotterdam)",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Schiehavenweg",
    houseNumber: "1",
    postalCode: "3089 JH",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24678901",
    roles: ["Receiver"],
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Processor" },
    servicePoints: [],
  },
  {
    name: "Indaver NL",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Oude Maasweg",
    houseNumber: "91",
    postalCode: "3197 KE",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24567890",
    roles: ["Receiver"],
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Processor" },
    servicePoints: [],
  },
  {
    name: "Attero NL",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Europaweg",
    houseNumber: "200",
    postalCode: "3199 LD",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24789012",
    roles: ["Receiver"],
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Processor" },
    servicePoints: [],
  },
  {
    name: "ATM Moerdijk",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Middenweg",
    houseNumber: "36",
    postalCode: "4782 PM",
    city: "Moerdijk",
    country: "Netherlands",
    kvkNumber: "24790123",
    roles: ["Receiver"],
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Processor" },
    servicePoints: [],
  },
  {
    name: "Specialist Hazardous Waste Center (NL)",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Industrieweg",
    houseNumber: "50",
    postalCode: "3044 AS",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24791234",
    roles: ["Receiver"],
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Processor" },
    servicePoints: [],
  },
  {
    name: "SUEZ NL",
    entityType: "Supplier",
    isTenant: false,
    isDefaultInternalCollector: false,
    street: "Shannonweg",
    houseNumber: "15",
    postalCode: "3197 KB",
    city: "Rotterdam",
    country: "Netherlands",
    kvkNumber: "24792345",
    roles: ["Receiver"],
    receiverConfig: { lmaReportingObligated: true, allowedWasteTypeIds: [], facilityType: "Sorting Facility" },
    servicePoints: [],
  },
]

interface EntitiesState {
  entities: Entity[]
  addEntity: (entity: Omit<Entity, "id" | "createdAt">) => Entity
  updateEntity: (id: string, entity: Omit<Entity, "id" | "createdAt">) => void
  deleteEntity: (id: string) => { success: boolean; error?: string }
  getEntitiesByRole: (role: EntityRole) => Entity[]
  getEntityById: (id: string) => Entity | undefined
  getServicePointsForEntity: (entityId: string) => ServicePoint[]
}

const STORAGE_KEY = "waste-app-entities"

const EntitiesContext = createContext<EntitiesState | undefined>(undefined)

export function EntitiesProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          if (Array.isArray(data) && data.length > 0) {
            setEntities(data)
          } else {
            // Empty array or invalid data - seed it
            const seededEntities = seedEntities()
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seededEntities))
            setEntities(seededEntities)
          }
        } catch (e) {
          console.error("Failed to parse entities:", e)
          const seededEntities = seedEntities()
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seededEntities))
          setEntities(seededEntities)
        }
      } else {
        const seededEntities = seedEntities()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seededEntities))
        setEntities(seededEntities)
      }
      setIsInitialized(true)
    }
  }, [])

  const seedEntities = (): Entity[] => {
    return SEED_ENTITIES.map((entity, idx) => ({
      ...entity,
      id: getStableEntityId(entity.name, idx),
      createdAt: new Date().toISOString(),
    }))
  }

  const getStableEntityId = (name: string, fallbackIdx: number): string => {
    const nameMap: Record<string, string> = {
      "Reinis N.V.": "reinis_nv",
      "Erasmus MC (Rotterdam)": "erasmus_mc",
      "Maasstad Ziekenhuis (Rotterdam)": "maasstad",
      "Port of Rotterdam Authority": "havenbedrijf",
      "Municipality of Rotterdam": "rotterdam_municipality",
      "Bouwcom Rotterdam BV (Construction)": "bouwcom",
      "Renewi (Rotterdam)": "renewi",
      "AVR Afvalverwerking (Rotterdam)": "avr",
      "Indaver NL": "indaver",
      "Attero NL": "attero",
      "ATM Moerdijk": "atm",
      "Specialist Hazardous Waste Center (NL)": "sme_haz",
      "SUEZ NL": "suez",
    }
    return nameMap[name] || `ent-seed-${fallbackIdx}`
  }

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entities))
    }
  }, [entities, isInitialized])

  const addEntity = (entity: Omit<Entity, "id" | "createdAt">) => {
    const newEntity: Entity = {
      ...entity,
      id: `ent-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    let updatedEntities = [...entities]

    if (newEntity.isDefaultInternalCollector) {
      updatedEntities = updatedEntities.map((e) => ({ ...e, isDefaultInternalCollector: false }))
    }

    updatedEntities.push(newEntity)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntities))
    setEntities(updatedEntities)

    return newEntity
  }

  const updateEntity = (id: string, updates: Omit<Entity, "id" | "createdAt">) => {
    let updatedEntities = entities.map((e) =>
      e.id === id ? { ...e, ...updates, id: e.id, createdAt: e.createdAt } : e,
    )

    if (updates.isDefaultInternalCollector) {
      updatedEntities = updatedEntities.map((e) => (e.id === id ? e : { ...e, isDefaultInternalCollector: false }))
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntities))
    setEntities(updatedEntities)
  }

  const deleteEntity = (id: string): { success: boolean; error?: string } => {
    // TODO: Check if entity is referenced in agreements/orders
    // For now, just delete
    const updated = entities.filter((e) => e.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setEntities(updated)
    return { success: true }
  }

  const getEntitiesByRole = (role: EntityRole) => {
    return entities.filter((e) => e.roles.includes(role))
  }

  const getEntityById = (id: string) => {
    return entities.find((e) => e.id === id)
  }

  const getServicePointsForEntity = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId)
    return entity?.servicePoints || []
  }

  return (
    <EntitiesContext.Provider
      value={{
        entities,
        addEntity,
        updateEntity,
        deleteEntity,
        getEntitiesByRole,
        getEntityById,
        getServicePointsForEntity,
      }}
    >
      {children}
    </EntitiesContext.Provider>
  )
}

export function useEntities() {
  const context = useContext(EntitiesContext)
  if (context === undefined) {
    throw new Error("useEntities must be used within an EntitiesProvider")
  }
  return context
}
