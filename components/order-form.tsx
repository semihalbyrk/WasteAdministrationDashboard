"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOrders, type WasteLine } from "@/lib/orders-store"
import { useApp } from "@/lib/store"
import { useOrderTypes } from "@/lib/order-types-store"
import { useEntities } from "@/lib/entities-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { X, ChevronLeft, Info, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"

interface TransferDetails {
  disposerId: string
  receiverId: string
  senderId: string
  agreementTransporterId: string // From agreement - for WTN Section 5
  useOutsourcedTransporter: boolean
  outsourcedTransporterId: string // For WTN Section 4A
  asn: string
  processingMethod: string
}

export function OrderForm() {
  const router = useRouter()
  const { addOrder } = useOrders()
  const { wasteTypes, agreements } = useApp()
  const { orderTypes } = useOrderTypes()
  const { entities, getEntitiesByRole, getServicePointsForEntity, getEntityById } = useEntities()

  const [entityId, setEntityId] = useState("")
  const [servicePointId, setServicePointId] = useState("")
  const [orderTypeId, setOrderTypeId] = useState("")
  const [fulfillmentDate, setFulfillmentDate] = useState("")
  const [orderName, setOrderName] = useState("")
  const [selectedWasteTypeIds, setSelectedWasteTypeIds] = useState<string[]>([])
  const [transferDetails, setTransferDetails] = useState<TransferDetails>({
    disposerId: "",
    receiverId: "",
    senderId: "",
    agreementTransporterId: "",
    useOutsourcedTransporter: false,
    outsourcedTransporterId: "",
    asn: "",
    processingMethod: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [noCommonReceiverError, setNoCommonReceiverError] = useState("")
  const [noDefaultCollectorError, setNoDefaultCollectorError] = useState("")

  const selectedOrderType = orderTypes.find((ot) => ot.id === orderTypeId)
  const allowMultipleWasteTypes = selectedOrderType?.wasteTypeSelection === "multiple"
  const lmaReportingMethod = selectedOrderType?.lmaReportingMethod
  const requiresWasteType =
    selectedOrderType?.wasteTypeSelection !== "none" && selectedOrderType?.wasteTypeSelection !== undefined

  const isRouteCollection = lmaReportingMethod === "route_collection"
  const isCollectorsSchema = lmaReportingMethod === "collectors_schema"
  const isBasicSystem = lmaReportingMethod === "basic_system"
  const requiresWtnLogic = (isBasicSystem || isCollectorsSchema) && !isRouteCollection

  // Get entities for dropdowns
  const allEntities = entities
  const disposers = getEntitiesByRole("Disposer")
  const senders = getEntitiesByRole("Sender")
  const transporters = getEntitiesByRole("Transporter")
  const receivers = getEntitiesByRole("Receiver")

  // Get service points for selected entity
  const servicePoints = entityId ? getServicePointsForEntity(entityId) : []

  // Get default internal collector for Collector Scheme
  const defaultInternalCollector = entities.find((e) => e.isDefaultInternalCollector && e.roles.includes("Transporter"))

  const isStep1Complete = !!(
    entityId &&
    orderTypeId &&
    fulfillmentDate &&
    (requiresWasteType ? selectedWasteTypeIds.length > 0 : true)
  )

  const isReceiverEnabled = (() => {
    if (selectedWasteTypeIds.length === 0) return false
    if (isBasicSystem) {
      return !!entityId
    }
    if (isCollectorsSchema) {
      return !!transferDetails.disposerId
    }
    return false
  })()

  const getReceiverPlaceholder = () => {
    if (selectedWasteTypeIds.length === 0) return "Select waste type first"
    if (isCollectorsSchema && !transferDetails.disposerId) return "Select disposer first"
    if (isBasicSystem && !entityId) return "Select entity first"
    return "Select receiver"
  }

  // Reset service point when entity changes
  useEffect(() => {
    setServicePointId("")
  }, [entityId])

  // Reset transfer details when order type changes
  useEffect(() => {
    setSelectedWasteTypeIds([])
    setTransferDetails({
      disposerId: "",
      receiverId: "",
      senderId: "",
      agreementTransporterId: "",
      useOutsourcedTransporter: false,
      outsourcedTransporterId: "",
      asn: "",
      processingMethod: "",
    })
    setNoCommonReceiverError("")
    setNoDefaultCollectorError("")
  }, [orderTypeId])

  // Handle entity change - auto-fill based on LMA method
  useEffect(() => {
    if (!entityId || !orderTypeId) return

    if (isBasicSystem) {
      // Basic System: Entity = Disposer (auto-fill, read-only)
      setTransferDetails((prev) => ({
        ...prev,
        disposerId: entityId,
      }))
    } else if (isCollectorsSchema) {
      // Disposer = Default Internal Collector (auto-fill, but EDITABLE)
      if (defaultInternalCollector) {
        setTransferDetails((prev) => ({
          ...prev,
          senderId: entityId,
          disposerId: defaultInternalCollector.id,
        }))
        setNoDefaultCollectorError("")
      } else {
        setTransferDetails((prev) => ({
          ...prev,
          senderId: entityId,
          disposerId: "",
        }))
        setNoDefaultCollectorError(
          "No Default Internal Collector is configured. Please mark one Transporter entity as Default Internal Collector.",
        )
      }
    }
  }, [entityId, orderTypeId, isBasicSystem, isCollectorsSchema, defaultInternalCollector])

  // Query common receivers and auto-fill when waste types change
  useEffect(() => {
    if (!isStep1Complete || isRouteCollection || selectedWasteTypeIds.length === 0) return

    const disposerId = isCollectorsSchema ? transferDetails.disposerId : entityId

    if (!disposerId) {
      setNoCommonReceiverError("")
      return
    }

    const { commonReceivers, defaultReceiver, agreementData } = queryCommonReceivers(selectedWasteTypeIds, disposerId)

    if (commonReceivers.length === 0 && selectedWasteTypeIds.length > 0) {
      setNoCommonReceiverError("No receiver is configured for all selected waste types under the current agreement.")
    } else {
      setNoCommonReceiverError("")

      // Auto-fill receiver if deterministically resolvable
      if (!transferDetails.receiverId) {
        if (commonReceivers.length === 1) {
          handleReceiverChange(commonReceivers[0].id, disposerId, agreementData)
        } else if (defaultReceiver) {
          handleReceiverChange(defaultReceiver, disposerId, agreementData)
        }
      }

      // Auto-fill agreement transporter (always from agreement)
      if (!transferDetails.agreementTransporterId && agreementData?.transporterId) {
        setTransferDetails((prev) => ({
          ...prev,
          agreementTransporterId: agreementData.transporterId,
        }))
      }

      if (isBasicSystem && !transferDetails.senderId && agreementData?.senderId) {
        setTransferDetails((prev) => ({
          ...prev,
          senderId: agreementData.senderId,
        }))
      }
    }
  }, [
    isStep1Complete,
    selectedWasteTypeIds,
    entityId,
    servicePointId,
    isBasicSystem,
    isCollectorsSchema,
    transferDetails.disposerId,
  ])

  useEffect(() => {
    if (!isCollectorsSchema || !transferDetails.disposerId || selectedWasteTypeIds.length === 0) return

    // Reset receiver when disposer changes
    setTransferDetails((prev) => ({
      ...prev,
      receiverId: "",
      asn: "",
      processingMethod: "",
      agreementTransporterId: "",
    }))
    setNoCommonReceiverError("")
  }, [transferDetails.disposerId, isCollectorsSchema])

  const queryCommonReceivers = (wasteTypeIds: string[], disposerId: string) => {
    if (!disposerId || wasteTypeIds.length === 0) {
      return { commonReceivers: [], defaultReceiver: null, agreementData: null }
    }

    const receiverSets: Set<string>[] = []
    const defaultReceivers: string[] = []
    let matchedAgreement: any = null

    wasteTypeIds.forEach((wasteTypeId) => {
      const matchingAgreements = agreements.filter((agr) => {
        const disposerMatch = agr.disposerId === disposerId
        const servicePointMatch = isCollectorsSchema
          ? true
          : !servicePointId || servicePointId === "no_service_point" || agr.servicePointId === servicePointId
        const activeMatch = agr.status === "Active"
        const reportingSystemMatch =
          (isBasicSystem && agr.reportingSystem === "Basic System") ||
          (isCollectorsSchema && agr.reportingSystem === "Collector Scheme")

        return disposerMatch && servicePointMatch && activeMatch && reportingSystemMatch
      })

      const receiversForThisType = new Set<string>()
      let defaultForThisType: string | null = null

      matchingAgreements.forEach((agr) => {
        agr.wasteStreams.forEach((ws) => {
          if (ws.wasteTypeId === wasteTypeId) {
            ws.destinations.forEach((dest) => {
              receiversForThisType.add(dest.receiverId)
              if (ws.defaultDestinationId === dest.id) {
                defaultForThisType = dest.receiverId
              }
            })
            if (!matchedAgreement) {
              matchedAgreement = agr
            }
          }
        })
      })

      receiverSets.push(receiversForThisType)
      if (defaultForThisType) {
        defaultReceivers.push(defaultForThisType)
      }
    })

    let commonReceivers: string[] = []
    if (receiverSets.length > 0) {
      commonReceivers = Array.from(receiverSets[0])
      for (let i = 1; i < receiverSets.length; i++) {
        commonReceivers = commonReceivers.filter((r) => receiverSets[i].has(r))
      }
    }

    const allSameDefault =
      defaultReceivers.length === wasteTypeIds.length && defaultReceivers.every((r) => r === defaultReceivers[0])
    const defaultReceiver = allSameDefault ? defaultReceivers[0] : null

    return {
      commonReceivers: commonReceivers.map((receiverId) => {
        const entity = getEntityById(receiverId)
        return { id: receiverId, label: entity?.name || receiverId }
      }),
      defaultReceiver,
      agreementData: matchedAgreement
        ? {
            senderId: matchedAgreement.senderId || "",
            transporterId: matchedAgreement.transporterId || "",
          }
        : null,
    }
  }

  const getAvailableReceivers = () => {
    const disposerId = isCollectorsSchema ? transferDetails.disposerId : entityId
    if (!disposerId || selectedWasteTypeIds.length === 0) return []

    const { commonReceivers } = queryCommonReceivers(selectedWasteTypeIds, disposerId)
    return commonReceivers
  }

  const resolveAgreementDetails = (wasteTypeId: string, receiverId: string, disposerId: string) => {
    if (!wasteTypeId || !receiverId || !disposerId) return null

    const matchingAgreement = agreements.find((agr) => {
      const disposerMatch = agr.disposerId === disposerId
      const servicePointMatch = isCollectorsSchema
        ? true
        : !servicePointId || servicePointId === "no_service_point" || agr.servicePointId === servicePointId
      const activeMatch = agr.status === "Active"
      const reportingSystemMatch =
        (isBasicSystem && agr.reportingSystem === "Basic System") ||
        (isCollectorsSchema && agr.reportingSystem === "Collector Scheme")
      const hasWasteStream = agr.wasteStreams.some(
        (ws) => ws.wasteTypeId === wasteTypeId && ws.destinations.some((d) => d.receiverId === receiverId),
      )

      return disposerMatch && servicePointMatch && activeMatch && reportingSystemMatch && hasWasteStream
    })

    if (!matchingAgreement) return null

    const wasteStream = matchingAgreement.wasteStreams.find((ws) => ws.wasteTypeId === wasteTypeId)
    if (!wasteStream) return null

    const destination = wasteStream.destinations.find((d) => d.receiverId === receiverId)
    if (!destination) return null

    return {
      asn: destination.asn,
      processingMethod: destination.processingMethod,
      senderId: matchingAgreement.senderId || "",
      transporterId: matchingAgreement.transporterId || "",
    }
  }

  const handleWasteTypeChange = (wasteTypeId: string) => {
    if (allowMultipleWasteTypes) {
      if (selectedWasteTypeIds.includes(wasteTypeId)) {
        setSelectedWasteTypeIds(selectedWasteTypeIds.filter((id) => id !== wasteTypeId))
      } else {
        setSelectedWasteTypeIds([...selectedWasteTypeIds, wasteTypeId])
      }
    } else {
      setSelectedWasteTypeIds([wasteTypeId])
    }
    setTransferDetails((prev) => ({
      ...prev,
      receiverId: "",
      asn: "",
      processingMethod: "",
      agreementTransporterId: "",
    }))
    setNoCommonReceiverError("")
  }

  const handleReceiverChange = (receiverId: string, disposerId?: string, agreementData?: any) => {
    const actualDisposer = disposerId || (isCollectorsSchema ? transferDetails.disposerId : entityId)

    const firstWasteTypeId = selectedWasteTypeIds[0]
    const resolved = resolveAgreementDetails(firstWasteTypeId, receiverId, actualDisposer)

    setTransferDetails((prev) => ({
      ...prev,
      receiverId,
      asn: resolved?.asn || "",
      processingMethod: resolved?.processingMethod || "",
      senderId: isCollectorsSchema ? prev.senderId : resolved?.senderId || prev.senderId,
      agreementTransporterId: resolved?.transporterId || prev.agreementTransporterId,
    }))
  }

  const handleDisposerChange = (newDisposerId: string) => {
    setTransferDetails((prev) => ({
      ...prev,
      disposerId: newDisposerId,
      // Reset dependent fields when disposer changes
      receiverId: "",
      asn: "",
      processingMethod: "",
      agreementTransporterId: "",
    }))
    setNoCommonReceiverError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!entityId) newErrors.entityId = "Entity is required"
    if (!orderTypeId) newErrors.orderTypeId = "Order Type is required"
    if (!fulfillmentDate) newErrors.fulfillmentDate = "Fulfillment Date is required"

    if (requiresWasteType && selectedWasteTypeIds.length === 0) {
      newErrors.wasteType = "Waste Type is required"
    }

    if (!isRouteCollection && selectedWasteTypeIds.length > 0) {
      if (isCollectorsSchema && !transferDetails.disposerId) {
        newErrors.disposer = "Disposer is required"
      }
      if (!transferDetails.receiverId) newErrors.receiver = "Receiver is required"
      if (!transferDetails.senderId) newErrors.sender = "Sender is required"
      if (!transferDetails.agreementTransporterId) newErrors.transporter = "Transporter is required"

      if (transferDetails.useOutsourcedTransporter && !transferDetails.outsourcedTransporterId) {
        newErrors.outsourcedTransporter = "Outsourced transporter is required when toggle is enabled"
      }

      if (noCommonReceiverError) {
        newErrors.receiver = noCommonReceiverError
      }
    }

    if (isCollectorsSchema && noDefaultCollectorError) {
      newErrors.disposer = noDefaultCollectorError
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error("Please fix the errors before submitting")
      return
    }

    const entity = getEntityById(entityId)
    const orderTypeName = orderTypes.find((ot) => ot.id === orderTypeId)?.name || ""
    const dateFormatted = new Date(fulfillmentDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    const finalOrderName = orderName.trim() || `${entity?.name || entityId} – ${orderTypeName} – ${dateFormatted}`

    const finalWasteLines: WasteLine[] = selectedWasteTypeIds.map((wtId, idx) => ({
      id: `wl-${Date.now()}-${idx}`,
      wasteTypeId: wtId,
      disposerId: isRouteCollection ? "" : isCollectorsSchema ? transferDetails.disposerId : entityId,
      receiverId: isRouteCollection ? "" : transferDetails.receiverId,
      asn: isRouteCollection ? "" : transferDetails.asn,
      processingMethod: isRouteCollection ? "" : transferDetails.processingMethod,
      afasRomNumber: "",
      senderId: isRouteCollection ? "" : transferDetails.senderId,
      transporterId: isRouteCollection ? "" : transferDetails.agreementTransporterId,
    }))

    addOrder({
      entityId,
      servicePointId: servicePointId || "no_service_point",
      orderTypeId,
      fulfillmentDate,
      orderName: finalOrderName,
      wasteLines: finalWasteLines,
      agreementTransporterEntityId: transferDetails.agreementTransporterId,
      useOutsourcedCarrier: transferDetails.useOutsourcedTransporter,
      outsourcedCarrierEntityId: transferDetails.useOutsourcedTransporter
        ? transferDetails.outsourcedTransporterId
        : undefined,
    })

    toast.success("Order created successfully")
    router.push("/orders")
  }

  const getWasteTypeName = (id: string) => {
    const wt = wasteTypes.find((w) => w.id === id)
    return wt ? `${wt.name} – ${wt.ewcCode}` : id
  }

  const availableReceivers = getAvailableReceivers()

  const getDisposerDisplayName = () => {
    if (isBasicSystem && entityId) {
      return getEntityById(entityId)?.name || entityId
    }
    if (isCollectorsSchema && transferDetails.disposerId) {
      return getEntityById(transferDetails.disposerId)?.name || transferDetails.disposerId
    }
    return ""
  }

  const getSenderDisplayName = () => {
    if (isCollectorsSchema && entityId) {
      return getEntityById(entityId)?.name || entityId
    }
    if (transferDetails.senderId) {
      return getEntityById(transferDetails.senderId)?.name || transferDetails.senderId
    }
    return ""
  }

  const getTransporterDisplayName = (transporterId: string) => {
    return getEntityById(transporterId)?.name || transporterId
  }

  const getOutsourcedTransporterInfo = (transporterId: string) => {
    const entity = getEntityById(transporterId)
    if (!entity) return null
    return {
      name: entity.name,
      address: `${entity.street} ${entity.houseNumber}, ${entity.postalCode} ${entity.city}`,
      vihbNumber: entity.vihbNumber || "N/A",
    }
  }

  const outsourcedTransporterInfo = transferDetails.outsourcedTransporterId
    ? getOutsourcedTransporterInfo(transferDetails.outsourcedTransporterId)
    : null

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add Order</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete order details and waste transfer information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Order Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Configure order parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="orderName">Order Name</Label>
                    <Input
                      id="orderName"
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div>
                    <Label htmlFor="entity">Entity *</Label>
                    <Select value={entityId} onValueChange={setEntityId}>
                      <SelectTrigger id="entity" className={errors.entityId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {allEntities.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.entityId && <p className="text-sm text-red-500 mt-1">{errors.entityId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="servicePoint">Service Point</Label>
                    <Select value={servicePointId} onValueChange={setServicePointId} disabled={!entityId}>
                      <SelectTrigger id="servicePoint">
                        <SelectValue placeholder={entityId ? "Select service point" : "Select entity first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_service_point">No Service Point</SelectItem>
                        {servicePoints.map((sp) => (
                          <SelectItem key={sp.id} value={sp.id}>
                            {sp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="orderType">Order Type *</Label>
                    <Select value={orderTypeId} onValueChange={setOrderTypeId}>
                      <SelectTrigger id="orderType" className={errors.orderTypeId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                      <SelectContent>
                        {orderTypes.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No order types available</div>
                        ) : (
                          orderTypes.map((ot) => (
                            <SelectItem key={ot.id} value={ot.id}>
                              {ot.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.orderTypeId && <p className="text-sm text-red-500 mt-1">{errors.orderTypeId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="fulfillmentDate">Fulfillment Date *</Label>
                    <Input
                      id="fulfillmentDate"
                      type="date"
                      value={fulfillmentDate}
                      onChange={(e) => setFulfillmentDate(e.target.value)}
                      className={errors.fulfillmentDate ? "border-red-500" : ""}
                    />
                    {errors.fulfillmentDate && <p className="text-sm text-red-500 mt-1">{errors.fulfillmentDate}</p>}
                  </div>

                  {requiresWasteType && orderTypeId && (
                    <div>
                      <Label htmlFor="wasteType">
                        Waste Type (Afvaltype) *
                        {allowMultipleWasteTypes && (
                          <span className="text-xs text-muted-foreground ml-2">(multi-select)</span>
                        )}
                      </Label>
                      {allowMultipleWasteTypes ? (
                        <div className="space-y-2">
                          <Select value="" onValueChange={handleWasteTypeChange}>
                            <SelectTrigger id="wasteType" className={errors.wasteType ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select waste type(s)" />
                            </SelectTrigger>
                            <SelectContent>
                              {wasteTypes.map((wt) => (
                                <SelectItem key={wt.id} value={wt.id} disabled={selectedWasteTypeIds.includes(wt.id)}>
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {wt.name} – {wt.ewcCode}
                                    </span>
                                    {wt.hazardous && (
                                      <Badge variant="destructive" className="text-xs">
                                        Hazardous
                                      </Badge>
                                    )}
                                    {selectedWasteTypeIds.includes(wt.id) && (
                                      <Badge variant="secondary" className="text-xs">
                                        Selected
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedWasteTypeIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedWasteTypeIds.map((wtId) => (
                                <Badge key={wtId} variant="secondary" className="flex items-center gap-1">
                                  {getWasteTypeName(wtId)}
                                  <button
                                    type="button"
                                    onClick={() => handleWasteTypeChange(wtId)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Select
                          value={selectedWasteTypeIds[0] || ""}
                          onValueChange={(value) => setSelectedWasteTypeIds([value])}
                        >
                          <SelectTrigger id="wasteType" className={errors.wasteType ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select waste type" />
                          </SelectTrigger>
                          <SelectContent>
                            {wasteTypes.map((wt) => (
                              <SelectItem key={wt.id} value={wt.id}>
                                <div className="flex items-center gap-2">
                                  <span>
                                    {wt.name} – {wt.ewcCode}
                                  </span>
                                  {wt.hazardous && (
                                    <Badge variant="destructive" className="text-xs">
                                      Hazardous
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {errors.wasteType && <p className="text-sm text-red-500 mt-1">{errors.wasteType}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Waste Transfer Details */}
            <div>
              <Card className={!isStep1Complete || isRouteCollection ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle>Waste Transfer Details</CardTitle>
                  <CardDescription>Configure parties and receiver destinations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRouteCollection ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Route Collection orders do not require waste transfer details</p>
                    </div>
                  ) : !isStep1Complete ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Complete Order Details first</p>
                    </div>
                  ) : selectedWasteTypeIds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for waste type selection...</p>
                    </div>
                  ) : (
                    <>
                      {/* Collector Scheme error for missing default collector */}
                      {isCollectorsSchema && noDefaultCollectorError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Configuration Required</AlertTitle>
                          <AlertDescription>{noDefaultCollectorError}</AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="disposer">
                          Disposer (Ontdoener) *
                          {isBasicSystem && <span className="text-xs text-muted-foreground ml-2">(from Entity)</span>}
                          {isCollectorsSchema && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (default from Internal Collector)
                            </span>
                          )}
                        </Label>
                        {isBasicSystem ? (
                          // Basic System: Disposer is read-only (from Entity)
                          <Input id="disposer" value={getDisposerDisplayName()} disabled className="bg-muted" />
                        ) : isCollectorsSchema ? (
                          <Select value={transferDetails.disposerId} onValueChange={handleDisposerChange}>
                            <SelectTrigger id="disposer" className={errors.disposer ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select disposer" />
                            </SelectTrigger>
                            <SelectContent>
                              {disposers.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                  {d.id === defaultInternalCollector?.id && (
                                    <span className="text-xs text-muted-foreground ml-2">(default)</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input id="disposer" value={getDisposerDisplayName()} disabled className="bg-muted" />
                        )}
                        {errors.disposer && <p className="text-sm text-red-500 mt-1">{errors.disposer}</p>}
                      </div>

                      {/* Receiver field */}
                      <div>
                        <Label htmlFor="receiver">Receiver (Ontvanger) *</Label>
                        <Select
                          value={transferDetails.receiverId}
                          onValueChange={(value) => handleReceiverChange(value)}
                          disabled={!isReceiverEnabled || !!noDefaultCollectorError}
                        >
                          <SelectTrigger id="receiver" className={errors.receiver ? "border-red-500" : ""}>
                            <SelectValue placeholder={getReceiverPlaceholder()} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableReceivers.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                No receivers available for this configuration
                              </div>
                            ) : (
                              availableReceivers.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.receiver && <p className="text-sm text-red-500 mt-1">{errors.receiver}</p>}
                        {noCommonReceiverError && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{noCommonReceiverError}</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* ASN and Processing Method */}
                      {transferDetails.receiverId && (transferDetails.asn || transferDetails.processingMethod) && (
                        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                          {transferDetails.asn && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">ASN</span>
                              <span className="font-medium font-mono">{transferDetails.asn}</span>
                            </div>
                          )}
                          {transferDetails.processingMethod && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Processing Method</span>
                              <span className="font-medium">{transferDetails.processingMethod}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label htmlFor="sender">
                          Sender (Afzender) *
                          {isCollectorsSchema && (
                            <span className="text-xs text-muted-foreground ml-2">(from Entity)</span>
                          )}
                        </Label>
                        {isCollectorsSchema ? (
                          <Input id="sender" value={getSenderDisplayName()} disabled className="bg-muted" />
                        ) : (
                          <>
                            <Select
                              value={transferDetails.senderId}
                              onValueChange={(value) => setTransferDetails((prev) => ({ ...prev, senderId: value }))}
                            >
                              <SelectTrigger id="sender" className={errors.sender ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select sender" />
                              </SelectTrigger>
                              <SelectContent>
                                {senders.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Default sender comes from the agreement. You may overwrite this if the actual sender
                              differs.
                            </p>
                          </>
                        )}
                        {errors.sender && <p className="text-sm text-red-500 mt-1">{errors.sender}</p>}
                      </div>

                      {requiresWtnLogic && (
                        <div>
                          <Label htmlFor="agreementTransporter">
                            Agreement Transporter (Begeleidingsbrief Section 5) *
                          </Label>
                          <Input
                            id="agreementTransporter"
                            value={
                              transferDetails.agreementTransporterId
                                ? getTransporterDisplayName(transferDetails.agreementTransporterId)
                                : "Will be resolved from agreement"
                            }
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This is the responsible transporter shown in Begeleidingsbrief Section 5.
                          </p>
                          {errors.transporter && <p className="text-sm text-red-500 mt-1">{errors.transporter}</p>}
                        </div>
                      )}

                      {requiresWtnLogic && transferDetails.agreementTransporterId && (
                        <div className="space-y-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="useOutsourcedTransporter">
                                Use outsourced transporter (subcontractor)
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Enable if transport will be executed by a different transporter than the agreement
                                transporter.
                              </p>
                            </div>
                            <Switch
                              id="useOutsourcedTransporter"
                              checked={transferDetails.useOutsourcedTransporter}
                              onCheckedChange={(checked) =>
                                setTransferDetails((prev) => ({
                                  ...prev,
                                  useOutsourcedTransporter: checked,
                                  outsourcedTransporterId: checked ? prev.outsourcedTransporterId : "",
                                }))
                              }
                            />
                          </div>

                          {transferDetails.useOutsourcedTransporter && (
                            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                              <div>
                                <Label htmlFor="outsourcedTransporter">
                                  Outsourced Transporter (Begeleidingsbrief Section 4A) *
                                </Label>
                                <Select
                                  value={transferDetails.outsourcedTransporterId}
                                  onValueChange={(value) =>
                                    setTransferDetails((prev) => ({ ...prev, outsourcedTransporterId: value }))
                                  }
                                >
                                  <SelectTrigger
                                    id="outsourcedTransporter"
                                    className={errors.outsourcedTransporter ? "border-red-500" : ""}
                                  >
                                    <SelectValue placeholder="Select outsourced transporter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {transporters.map((t) => (
                                      <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.outsourcedTransporter && (
                                  <p className="text-sm text-red-500 mt-1">{errors.outsourcedTransporter}</p>
                                )}
                              </div>

                              {/* Outsourced Transporter Preview */}
                              {outsourcedTransporterInfo && (
                                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                                  <p className="text-xs font-medium text-blue-800">
                                    Outsourced Transporter Details (Begeleidingsbrief Section 4A)
                                  </p>
                                  <div className="grid grid-cols-1 gap-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-blue-600">Name</span>
                                      <span className="font-medium text-blue-900">
                                        {outsourcedTransporterInfo.name}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-600">Address</span>
                                      <span className="font-medium text-blue-900">
                                        {outsourcedTransporterInfo.address}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-600">VIHB Number</span>
                                      <span className="font-medium text-blue-900">
                                        {outsourcedTransporterInfo.vihbNumber}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-xs text-amber-800">
                                  <strong>Begeleidingsbrief mapping:</strong> Section 5 will show "
                                  {getTransporterDisplayName(transferDetails.agreementTransporterId)}" with "uitbesteed
                                  vervoer" checkbox ticked. Section 4A will show "
                                  {outsourcedTransporterInfo?.name || "selected outsourced transporter"}".
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.push("/orders")}>
              Cancel
            </Button>
            <Button type="submit">Create Order</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
