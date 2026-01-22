"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ==================== Static Tour ====================
export interface StaticTour {
  id: string
  name: string
  operation: string // "HaH Collection" | "Commercial Collection" | etc.
  regions: string[]
  startLocation: string
  endLocation: string
  disposalLocation: string
  fuelStation?: string
  wasteTypeId: string
  defaultReceiverEntityId?: string
  description?: string
  createdAt: string
}

// ==================== Route ====================
export type RouteStatus = "Upcoming" | "In Progress" | "Completed" | "Expired"

export interface Route {
  id: string
  routeName: string
  staticTourId: string
  date: string
  startTime: string
  endTime: string
  status: RouteStatus
  wasteTypeId: string
  // Parties resolved from agreement
  senderId: string
  disposerId: string
  transporterId: string
  receiverId: string
  asn: string
  processingMethod: string
  // Agreement reference
  agreementId: string
  // Linked objects
  begeleidingsbriefId: string
  inboundId?: string
  createdAt: string
}

// ==================== Begeleidingsbrief ====================
export type BegeleidingsbriefStatus = "Ready" | "OnTheWay" | "Arrived" | "Completed"

export interface AuditLogEntry {
  timestamp: string
  action: string
  changedFields?: string
}

export interface Begeleidingsbrief {
  id: string
  status: BegeleidingsbriefStatus
  linkedRouteId: string
  // Section 1: Afzender (Sender)
  senderEntityId: string
  senderName: string
  senderAddress: string
  // Section 3A: Ontdoener (Disposer)
  disposerEntityId: string
  disposerName: string
  disposerAddress: string
  // Section 3B: Locatie van Herkomst (Origin Location)
  originLocation: string
  originRegion?: string
  // Section 4B: Bestemming (Receiver/Destination)
  receiverEntityId: string
  receiverName: string
  receiverAddress: string
  // ASN + Processing
  wasteTypeId: string
  wasteTypeName: string
  ewcCode: string
  asn: string
  processingMethod: string
  // Weight fields
  estimatedWeight?: number
  actualNetWeight?: number
  // Delivery
  deliveryDateTime?: string
  // Audit log
  auditLog: AuditLogEntry[]
  createdAt: string
  lastUpdatedAt: string
}

// ==================== Inbound ====================
export type InboundStatus = "New" | "In Progress" | "Closed"

export interface Inbound {
  id: string
  arriveDate: string
  linkedRouteId: string
  receiverEntityId: string
  transporterEntityId: string
  wasteTypeId: string
  asn: string
  vehiclePlate?: string
  firstWeight?: number
  secondWeight?: number
  netWeight?: number
  status: InboundStatus
  begFormNumber?: string
  createdAt: string
}

// ==================== Disposal ====================
export interface Disposal {
  id: string
  dateTime: string
  routeId: string
  inboundId: string
  disposerEntityId: string
  receiverEntityId: string
  wasteTypeId: string
  asn: string
  carrierEntityId: string
  firstWeight?: number
  secondWeight?: number
  netWeight?: number
  weighbridgeTicket?: string
  createdAt: string
}

const STORAGE_KEY_STATIC_TOURS = "waste-app-static-tours"
const STORAGE_KEY_ROUTES = "waste-app-routes"
const STORAGE_KEY_BEGELEIDINGSBRIEVEN = "waste-app-begeleidingsbrieven"
const STORAGE_KEY_INBOUNDS = "waste-app-inbounds"
const STORAGE_KEY_DISPOSALS = "waste-app-disposals"

interface RoutesState {
  // Static Tours
  staticTours: StaticTour[]
  addStaticTour: (tour: Omit<StaticTour, "id" | "createdAt">) => StaticTour
  updateStaticTour: (id: string, tour: Omit<StaticTour, "id" | "createdAt">) => void
  deleteStaticTour: (id: string) => void
  getStaticTourById: (id: string) => StaticTour | undefined

  // Routes
  routes: Route[]
  addRoute: (route: Omit<Route, "id" | "createdAt">) => Route
  updateRoute: (id: string, updates: Partial<Route>) => void
  deleteRoute: (id: string) => void
  getRouteById: (id: string) => Route | undefined
  generateRoutesFromTour: (
    tourId: string,
    dates: string[],
    agreementData: {
      agreementId: string
      senderId: string
      disposerId: string
      transporterId: string
      receiverId: string
      asn: string
      processingMethod: string
    },
  ) => Route[]

  // Begeleidingsbrieven
  begeleidingsbrieven: Begeleidingsbrief[]
  getBegeleidingsbriefById: (id: string) => Begeleidingsbrief | undefined
  getBegeleidingsbriefByRouteId: (routeId: string) => Begeleidingsbrief | undefined
  updateBegeleidingsbrief: (id: string, updates: Partial<Begeleidingsbrief>, auditAction: string) => void

  // Inbounds
  inbounds: Inbound[]
  addInbound: (inbound: Omit<Inbound, "id" | "createdAt">) => Inbound
  updateInbound: (id: string, updates: Partial<Inbound>) => void
  closeInbound: (id: string, firstWeight: number, secondWeight: number) => void
  getInboundById: (id: string) => Inbound | undefined
  getInboundByRouteId: (routeId: string) => Inbound | undefined

  // Disposals
  disposals: Disposal[]
  getDisposalById: (id: string) => Disposal | undefined
  getDisposalsByRouteId: (routeId: string) => Disposal[]
}

const RoutesContext = createContext<RoutesState | undefined>(undefined)

export function RoutesProvider({ children }: { children: ReactNode }) {
  const [staticTours, setStaticTours] = useState<StaticTour[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [begeleidingsbrieven, setBegeleidingsbrieven] = useState<Begeleidingsbrief[]>([])
  const [inbounds, setInbounds] = useState<Inbound[]>([])
  const [disposals, setDisposals] = useState<Disposal[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedTours = localStorage.getItem(STORAGE_KEY_STATIC_TOURS)
        const storedRoutes = localStorage.getItem(STORAGE_KEY_ROUTES)
        const storedBeg = localStorage.getItem(STORAGE_KEY_BEGELEIDINGSBRIEVEN)
        const storedInbounds = localStorage.getItem(STORAGE_KEY_INBOUNDS)
        const storedDisposals = localStorage.getItem(STORAGE_KEY_DISPOSALS)

        if (storedTours) setStaticTours(JSON.parse(storedTours))
        if (storedRoutes) setRoutes(JSON.parse(storedRoutes))
        if (storedBeg) setBegeleidingsbrieven(JSON.parse(storedBeg))
        if (storedInbounds) setInbounds(JSON.parse(storedInbounds))
        if (storedDisposals) setDisposals(JSON.parse(storedDisposals))
      } catch (e) {
        console.error("Failed to load routes data:", e)
      }
      setIsInitialized(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_STATIC_TOURS, JSON.stringify(staticTours))
    }
  }, [staticTours, isInitialized])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(routes))
    }
  }, [routes, isInitialized])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_BEGELEIDINGSBRIEVEN, JSON.stringify(begeleidingsbrieven))
    }
  }, [begeleidingsbrieven, isInitialized])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_INBOUNDS, JSON.stringify(inbounds))
    }
  }, [inbounds, isInitialized])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DISPOSALS, JSON.stringify(disposals))
    }
  }, [disposals, isInitialized])

  // ==================== Static Tour CRUD ====================
  const addStaticTour = (tour: Omit<StaticTour, "id" | "createdAt">) => {
    const newTour: StaticTour = {
      ...tour,
      id: `tour-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    const updated = [...staticTours, newTour]
    localStorage.setItem(STORAGE_KEY_STATIC_TOURS, JSON.stringify(updated))
    setStaticTours(updated)
    return newTour
  }

  const updateStaticTour = (id: string, updates: Omit<StaticTour, "id" | "createdAt">) => {
    const updated = staticTours.map((t) => (t.id === id ? { ...t, ...updates } : t))
    localStorage.setItem(STORAGE_KEY_STATIC_TOURS, JSON.stringify(updated))
    setStaticTours(updated)
  }

  const deleteStaticTour = (id: string) => {
    const updated = staticTours.filter((t) => t.id !== id)
    localStorage.setItem(STORAGE_KEY_STATIC_TOURS, JSON.stringify(updated))
    setStaticTours(updated)
  }

  const getStaticTourById = (id: string) => staticTours.find((t) => t.id === id)

  // ==================== Route CRUD ====================
  const addRoute = (route: Omit<Route, "id" | "createdAt">) => {
    const newRoute: Route = {
      ...route,
      id: `route-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    const updated = [...routes, newRoute]
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(updated))
    setRoutes(updated)
    return newRoute
  }

  const updateRoute = (id: string, updates: Partial<Route>) => {
    const updated = routes.map((r) => (r.id === id ? { ...r, ...updates } : r))
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(updated))
    setRoutes(updated)
  }

  const deleteRoute = (id: string) => {
    const updated = routes.filter((r) => r.id !== id)
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(updated))
    setRoutes(updated)
  }

  const getRouteById = (id: string) => routes.find((r) => r.id === id)

  const createBegeleidingsbrief = (
    routeId: string,
    senderEntity: { id: string; name: string; address: string },
    disposerEntity: { id: string; name: string; address: string },
    receiverEntity: { id: string; name: string; address: string },
    originLocation: string,
    originRegion: string,
    wasteType: { id: string; name: string; ewcCode: string },
    asn: string,
    processingMethod: string,
  ): Begeleidingsbrief => {
    const now = new Date().toISOString()
    const newBeg: Begeleidingsbrief = {
      id: `beg-${Date.now()}`,
      status: "Ready",
      linkedRouteId: routeId,
      senderEntityId: senderEntity.id,
      senderName: senderEntity.name,
      senderAddress: senderEntity.address,
      disposerEntityId: disposerEntity.id,
      disposerName: disposerEntity.name,
      disposerAddress: disposerEntity.address,
      originLocation,
      originRegion,
      receiverEntityId: receiverEntity.id,
      receiverName: receiverEntity.name,
      receiverAddress: receiverEntity.address,
      wasteTypeId: wasteType.id,
      wasteTypeName: wasteType.name,
      ewcCode: wasteType.ewcCode,
      asn,
      processingMethod,
      auditLog: [{ timestamp: now, action: "Created", changedFields: "Initial creation" }],
      createdAt: now,
      lastUpdatedAt: now,
    }
    return newBeg
  }

  const generateRoutesFromTour = (
    tourId: string,
    dates: string[],
    agreementData: {
      agreementId: string
      senderId: string
      disposerId: string
      transporterId: string
      receiverId: string
      asn: string
      processingMethod: string
    },
  ) => {
    const tour = getStaticTourById(tourId)
    if (!tour) return []

    const generatedRoutes: Route[] = []
    const generatedBegs: Begeleidingsbrief[] = []

    dates.forEach((date, idx) => {
      const routeId = `route-${Date.now()}-${idx}`
      const begId = `beg-${Date.now()}-${idx}`
      const now = new Date().toISOString()

      // Determine status based on date
      const routeDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let status: RouteStatus = "Upcoming"
      if (routeDate < today) {
        status = "Expired"
      }

      const newRoute: Route = {
        id: routeId,
        routeName: `${tour.name} - ${date}`,
        staticTourId: tourId,
        date,
        startTime: "07:00",
        endTime: "15:00",
        status,
        wasteTypeId: tour.wasteTypeId,
        senderId: agreementData.senderId,
        disposerId: agreementData.disposerId,
        transporterId: agreementData.transporterId,
        receiverId: agreementData.receiverId,
        asn: agreementData.asn,
        processingMethod: agreementData.processingMethod,
        agreementId: agreementData.agreementId,
        begeleidingsbriefId: begId,
        createdAt: now,
      }

      // Create placeholder begeleidingsbrief (will be populated with entity data separately)
      const newBeg: Begeleidingsbrief = {
        id: begId,
        status: "Ready",
        linkedRouteId: routeId,
        senderEntityId: agreementData.senderId,
        senderName: "",
        senderAddress: "",
        disposerEntityId: agreementData.disposerId,
        disposerName: "",
        disposerAddress: "",
        originLocation: tour.startLocation || tour.disposalLocation || "",
        originRegion: tour.regions.join(", "),
        receiverEntityId: agreementData.receiverId,
        receiverName: "",
        receiverAddress: "",
        wasteTypeId: tour.wasteTypeId,
        wasteTypeName: "",
        ewcCode: "",
        asn: agreementData.asn,
        processingMethod: agreementData.processingMethod,
        auditLog: [{ timestamp: now, action: "Created", changedFields: "Auto-generated from Static Tour" }],
        createdAt: now,
        lastUpdatedAt: now,
      }

      generatedRoutes.push(newRoute)
      generatedBegs.push(newBeg)
    })

    // Save routes
    const updatedRoutes = [...routes, ...generatedRoutes]
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(updatedRoutes))
    setRoutes(updatedRoutes)

    // Save begeleidingsbrieven
    const updatedBegs = [...begeleidingsbrieven, ...generatedBegs]
    localStorage.setItem(STORAGE_KEY_BEGELEIDINGSBRIEVEN, JSON.stringify(updatedBegs))
    setBegeleidingsbrieven(updatedBegs)

    return generatedRoutes
  }

  // ==================== Begeleidingsbrief ====================
  const getBegeleidingsbriefById = (id: string) => begeleidingsbrieven.find((b) => b.id === id)
  const getBegeleidingsbriefByRouteId = (routeId: string) =>
    begeleidingsbrieven.find((b) => b.linkedRouteId === routeId)

  const updateBegeleidingsbrief = (id: string, updates: Partial<Begeleidingsbrief>, auditAction: string) => {
    const now = new Date().toISOString()
    const updated = begeleidingsbrieven.map((b) => {
      if (b.id !== id) return b
      const changedFields = Object.keys(updates).join(", ")
      return {
        ...b,
        ...updates,
        lastUpdatedAt: now,
        auditLog: [...b.auditLog, { timestamp: now, action: auditAction, changedFields }],
      }
    })
    localStorage.setItem(STORAGE_KEY_BEGELEIDINGSBRIEVEN, JSON.stringify(updated))
    setBegeleidingsbrieven(updated)
  }

  // ==================== Inbound CRUD ====================
  const addInbound = (inbound: Omit<Inbound, "id" | "createdAt">) => {
    const newInbound: Inbound = {
      ...inbound,
      id: `inb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    const updated = [...inbounds, newInbound]
    localStorage.setItem(STORAGE_KEY_INBOUNDS, JSON.stringify(updated))
    setInbounds(updated)

    // Link inbound to route
    const route = routes.find((r) => r.id === inbound.linkedRouteId)
    if (route) {
      updateRoute(route.id, { inboundId: newInbound.id })
    }

    return newInbound
  }

  const updateInbound = (id: string, updates: Partial<Inbound>) => {
    const updated = inbounds.map((i) => (i.id === id ? { ...i, ...updates } : i))
    localStorage.setItem(STORAGE_KEY_INBOUNDS, JSON.stringify(updated))
    setInbounds(updated)
  }

  const getInboundById = (id: string) => inbounds.find((i) => i.id === id)
  const getInboundByRouteId = (routeId: string) => inbounds.find((i) => i.linkedRouteId === routeId)

  const closeInbound = (id: string, firstWeight: number, secondWeight: number) => {
    const inbound = getInboundById(id)
    if (!inbound) return

    const netWeight = Math.abs(firstWeight - secondWeight)
    const now = new Date().toISOString()

    // Update inbound
    const updatedInbounds = inbounds.map((i) =>
      i.id === id ? { ...i, firstWeight, secondWeight, netWeight, status: "Closed" as InboundStatus } : i,
    )
    localStorage.setItem(STORAGE_KEY_INBOUNDS, JSON.stringify(updatedInbounds))
    setInbounds(updatedInbounds)

    // Update route status
    const route = routes.find((r) => r.id === inbound.linkedRouteId)
    if (route) {
      updateRoute(route.id, { status: "Completed" })
    }

    // Update begeleidingsbrief
    const beg = begeleidingsbrieven.find((b) => b.linkedRouteId === inbound.linkedRouteId)
    if (beg) {
      updateBegeleidingsbrief(
        beg.id,
        {
          status: "Completed",
          actualNetWeight: netWeight,
          deliveryDateTime: now,
        },
        "Inbound closed - weights recorded",
      )
    }

    // Create disposal record
    const newDisposal: Disposal = {
      id: `disp-${Date.now()}`,
      dateTime: now,
      routeId: inbound.linkedRouteId,
      inboundId: id,
      disposerEntityId: route?.disposerId || "",
      receiverEntityId: inbound.receiverEntityId,
      wasteTypeId: inbound.wasteTypeId,
      asn: inbound.asn,
      carrierEntityId: inbound.transporterEntityId,
      firstWeight,
      secondWeight,
      netWeight,
      createdAt: now,
    }
    const updatedDisposals = [...disposals, newDisposal]
    localStorage.setItem(STORAGE_KEY_DISPOSALS, JSON.stringify(updatedDisposals))
    setDisposals(updatedDisposals)
  }

  // ==================== Disposal ====================
  const getDisposalById = (id: string) => disposals.find((d) => d.id === id)
  const getDisposalsByRouteId = (routeId: string) => disposals.filter((d) => d.routeId === routeId)

  return (
    <RoutesContext.Provider
      value={{
        staticTours,
        addStaticTour,
        updateStaticTour,
        deleteStaticTour,
        getStaticTourById,
        routes,
        addRoute,
        updateRoute,
        deleteRoute,
        getRouteById,
        generateRoutesFromTour,
        begeleidingsbrieven,
        getBegeleidingsbriefById,
        getBegeleidingsbriefByRouteId,
        updateBegeleidingsbrief,
        inbounds,
        addInbound,
        updateInbound,
        closeInbound,
        getInboundById,
        getInboundByRouteId,
        disposals,
        getDisposalById,
        getDisposalsByRouteId,
      }}
    >
      {children}
    </RoutesContext.Provider>
  )
}

export function useRoutes() {
  const context = useContext(RoutesContext)
  if (context === undefined) {
    throw new Error("useRoutes must be used within a RoutesProvider")
  }
  return context
}
