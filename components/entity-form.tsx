"use client"

import type React from "react"
import {
  useEntities,
  type EntityRole,
  type EntityType,
  type SenderLegalRole,
  type TransporterFleetSource,
  type TransporterLegalCapability,
  type ReceiverFacilityType,
} from "@/lib/entities-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, X, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EntityFormProps {
  entityId?: string
}

const ENTITY_TYPES: EntityType[] = ["Customer", "Supplier", "Partner", "Internal Branch"]
const ROLE_OPTIONS: EntityRole[] = ["Sender", "Disposer", "Transporter", "Receiver"]
const SENDER_LEGAL_ROLES: SenderLegalRole[] = ["Ontdoener", "Ontvanger", "Handelaar", "Bemiddelaar"]
const TRANSPORTER_FLEET_SOURCES: TransporterFleetSource[] = ["Internal", "External"]
const TRANSPORTER_LEGAL_CAPABILITIES: TransporterLegalCapability[] = ["Inzamelaars", "Vervoerder"]
const RECEIVER_FACILITY_TYPES: ReceiverFacilityType[] = ["Processor", "Transfer Station", "Sorting Facility", "Storage"]

export function EntityForm({ entityId }: EntityFormProps) {
  const { entities, addEntity, updateEntity } = useEntities()
  const router = useRouter()
  const existingEntity = entityId ? entities.find((e) => e.id === entityId) : null

  // General Information
  const [name, setName] = useState(existingEntity?.name || "")
  const [entityType, setEntityType] = useState<EntityType>(existingEntity?.entityType || "Customer")
  const [isDefaultInternalCollector, setIsDefaultInternalCollector] = useState(
    existingEntity?.isDefaultInternalCollector || false,
  )

  // Address
  const [street, setStreet] = useState(existingEntity?.street || "")
  const [houseNumber, setHouseNumber] = useState(existingEntity?.houseNumber || "")
  const [postalCode, setPostalCode] = useState(existingEntity?.postalCode || "")
  const [city, setCity] = useState(existingEntity?.city || "")
  const [country] = useState(existingEntity?.country || "Netherlands")

  // Registry
  const [kvkNumber, setKvkNumber] = useState(existingEntity?.kvkNumber || "")
  const [vihbNumber, setVihbNumber] = useState(existingEntity?.vihbNumber || "")

  // Roles
  const [roles, setRoles] = useState<EntityRole[]>(existingEntity?.roles || [])

  // Sender Config
  const [senderLegalRoles, setSenderLegalRoles] = useState<SenderLegalRole[]>(
    existingEntity?.senderConfig?.legalRoles || [],
  )

  // Transporter Config
  const [transporterFleetSource, setTransporterFleetSource] = useState<TransporterFleetSource>(
    existingEntity?.transporterConfig?.fleetSource || "Internal",
  )
  const [transporterLegalCapabilities, setTransporterLegalCapabilities] = useState<TransporterLegalCapability[]>(
    existingEntity?.transporterConfig?.legalCapabilities || [],
  )
  const [internationalTransport, setInternationalTransport] = useState(
    existingEntity?.transporterConfig?.internationalTransport || false,
  )
  const [eurovergunning, setEurovergunning] = useState(existingEntity?.transporterConfig?.eurovergunning || "")

  // Receiver Config
  const [lmaReportingObligated, setLmaReportingObligated] = useState(
    existingEntity?.receiverConfig?.lmaReportingObligated || false,
  )
  const [processorNumber, setProcessorNumber] = useState(existingEntity?.receiverConfig?.processorNumber || "")
  const [allowedWasteTypeIds, setAllowedWasteTypeIds] = useState<string[]>(
    existingEntity?.receiverConfig?.allowedWasteTypeIds || [],
  )
  const [facilityType, setFacilityType] = useState<ReceiverFacilityType | "">(
    existingEntity?.receiverConfig?.facilityType || "",
  )

  // Service Points
  const [servicePoints, setServicePoints] = useState(existingEntity?.servicePoints || [])

  const hasSenderHnB = senderLegalRoles.includes("Handelaar") || senderLegalRoles.includes("Bemiddelaar")
  const isVihbRequired = roles.includes("Transporter") || (roles.includes("Sender") && hasSenderHnB)

  const handleRoleToggle = (role: EntityRole) => {
    setRoles((prev) => {
      if (prev.includes(role)) {
        if (role === "Transporter") {
          setIsDefaultInternalCollector(false)
        }
        return prev.filter((r) => r !== role)
      }
      return [...prev, role]
    })
  }

  // ... existing code for handleSenderLegalRoleToggle, handleTransporterCapabilityToggle, service points ...

  const handleSenderLegalRoleToggle = (role: SenderLegalRole) => {
    setSenderLegalRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role)
      }
      return [...prev, role]
    })
  }

  const handleTransporterCapabilityToggle = (cap: TransporterLegalCapability) => {
    setTransporterLegalCapabilities((prev) => {
      if (prev.includes(cap)) {
        return prev.filter((c) => c !== cap)
      }
      return [...prev, cap]
    })
  }

  const handleAddServicePoint = () => {
    setServicePoints([
      ...servicePoints,
      { id: `sp-${Date.now()}`, name: "", street: "", houseNumber: "", postalCode: "", city: "" },
    ])
  }

  const handleRemoveServicePoint = (id: string) => {
    setServicePoints(servicePoints.filter((sp) => sp.id !== id))
  }

  const handleServicePointChange = (id: string, field: string, value: string) => {
    setServicePoints(servicePoints.map((sp) => (sp.id === id ? { ...sp, [field]: value } : sp)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const entityData = {
      name,
      entityType,
      isTenant: false, // Always false now, field removed
      isDefaultInternalCollector: roles.includes("Transporter") ? isDefaultInternalCollector : false,
      street,
      houseNumber,
      postalCode,
      city,
      country,
      kvkNumber,
      vihbNumber: isVihbRequired ? vihbNumber : undefined,
      roles,
      senderConfig: roles.includes("Sender") ? { legalRoles: senderLegalRoles } : undefined,
      transporterConfig: roles.includes("Transporter")
        ? {
            fleetSource: transporterFleetSource,
            legalCapabilities: transporterLegalCapabilities,
            internationalTransport,
            eurovergunning: internationalTransport ? eurovergunning : undefined,
          }
        : undefined,
      receiverConfig: roles.includes("Receiver")
        ? {
            lmaReportingObligated,
            processorNumber: processorNumber || undefined,
            allowedWasteTypeIds,
            facilityType: facilityType || undefined,
          }
        : undefined,
      servicePoints: servicePoints.filter((sp) => sp.name && sp.city),
    }

    if (entityId) {
      updateEntity(entityId, entityData)
    } else {
      addEntity(entityData)
    }

    router.push("/entities")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card 1: General Information */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic company details and classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type *</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Address Details */}
      <Card>
        <CardHeader>
          <CardTitle>Address Details</CardTitle>
          <CardDescription>Primary business address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="street">Street Name *</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="houseNumber">House Number *</Label>
              <Input id="houseNumber" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Registry / Compliance Identifiers */}
      <Card>
        <CardHeader>
          <CardTitle>Registry / Compliance Identifiers</CardTitle>
          <CardDescription>Official registration numbers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kvkNumber">KVK Number *</Label>
              <Input id="kvkNumber" value={kvkNumber} onChange={(e) => setKvkNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vihbNumber">
                VIHB Number {isVihbRequired && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="vihbNumber"
                value={vihbNumber}
                onChange={(e) => setVihbNumber(e.target.value)}
                required={isVihbRequired}
                placeholder={isVihbRequired ? "Required for this role configuration" : "Optional"}
              />
              {isVihbRequired && (
                <p className="text-xs text-muted-foreground">
                  Required when Transporter role is enabled, or Sender has Handelaar/Bemiddelaar legal role
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Role Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Role Configuration</CardTitle>
          <CardDescription>Select the roles this entity can perform in waste management operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {ROLE_OPTIONS.map((role) => (
              <div key={role} className="flex items-center gap-2">
                <Checkbox id={role} checked={roles.includes(role)} onCheckedChange={() => handleRoleToggle(role)} />
                <Label htmlFor={role} className="cursor-pointer font-medium">
                  {role}
                </Label>
              </div>
            ))}
          </div>

          {/* Sender Sub-section */}
          {roles.includes("Sender") && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium">Sender Configuration</h4>
              <div className="space-y-2">
                <Label>Legal Role(s) *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SENDER_LEGAL_ROLES.map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <Checkbox
                        id={`sender-${role}`}
                        checked={senderLegalRoles.includes(role)}
                        onCheckedChange={() => handleSenderLegalRoleToggle(role)}
                      />
                      <Label htmlFor={`sender-${role}`} className="cursor-pointer text-sm">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
                {senderLegalRoles.length === 0 && (
                  <p className="text-xs text-destructive">At least one legal role must be selected</p>
                )}
              </div>
            </div>
          )}

          {/* Disposer Sub-section */}
          {roles.includes("Disposer") && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Disposer Configuration</h4>
              <p className="text-sm text-muted-foreground mt-1">No extra fields required for Disposer at this time.</p>
            </div>
          )}

          {/* Transporter Sub-section */}
          {roles.includes("Transporter") && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium">Transporter Configuration</h4>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="defaultCollector"
                  checked={isDefaultInternalCollector}
                  onCheckedChange={(c) => setIsDefaultInternalCollector(!!c)}
                />
                <Label htmlFor="defaultCollector" className="cursor-pointer">
                  Default Internal Collector
                </Label>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Collector Scheme behavior</AlertTitle>
                <AlertDescription className="text-blue-700">
                  If this entity is set as the Default Internal Collector, then in Collector Scheme orders the Disposer
                  will be auto-assigned to this entity.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fleet Source *</Label>
                  <Select
                    value={transporterFleetSource}
                    onValueChange={(v) => setTransporterFleetSource(v as TransporterFleetSource)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORTER_FLEET_SOURCES.map((fs) => (
                        <SelectItem key={fs} value={fs}>
                          {fs}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Legal Capabilities *</Label>
                <div className="flex gap-4">
                  {TRANSPORTER_LEGAL_CAPABILITIES.map((cap) => (
                    <div key={cap} className="flex items-center gap-2">
                      <Checkbox
                        id={`trans-${cap}`}
                        checked={transporterLegalCapabilities.includes(cap)}
                        onCheckedChange={() => handleTransporterCapabilityToggle(cap)}
                      />
                      <Label htmlFor={`trans-${cap}`} className="cursor-pointer text-sm">
                        {cap === "Inzamelaars" ? "Inzamelaars (Collector)" : "Vervoerder (Carrier)"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="intlTransport"
                    checked={internationalTransport}
                    onCheckedChange={setInternationalTransport}
                  />
                  <Label htmlFor="intlTransport" className="cursor-pointer">
                    International Transport
                  </Label>
                </div>

                {internationalTransport && (
                  <div className="space-y-2">
                    <Label htmlFor="eurovergunning">Eurovergunning *</Label>
                    <Input
                      id="eurovergunning"
                      value={eurovergunning}
                      onChange={(e) => setEurovergunning(e.target.value)}
                      required={internationalTransport}
                      placeholder="EU transport permit number"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receiver Sub-section */}
          {roles.includes("Receiver") && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium">Receiver Configuration</h4>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="lmaObligated"
                  checked={lmaReportingObligated}
                  onCheckedChange={(c) => setLmaReportingObligated(!!c)}
                />
                <Label htmlFor="lmaObligated" className="cursor-pointer">
                  LMA Reporting Obligated
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processorNumber">Processor Number (Verwerkersnummer)</Label>
                  <Input
                    id="processorNumber"
                    value={processorNumber}
                    onChange={(e) => setProcessorNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityType">Facility Type</Label>
                  <Select value={facilityType} onValueChange={(v) => setFacilityType(v as ReceiverFacilityType)}>
                    <SelectTrigger id="facilityType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEIVER_FACILITY_TYPES.map((ft) => (
                        <SelectItem key={ft} value={ft}>
                          {ft}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 5: Service Points */}
      <Card>
        <CardHeader>
          <CardTitle>Service Points</CardTitle>
          <CardDescription>Physical locations for this entity (used in Orders and Agreements)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {servicePoints.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No service points defined. Add service points if this entity has multiple physical locations.
              </AlertDescription>
            </Alert>
          )}

          {servicePoints.map((sp, index) => (
            <div key={sp.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Service Point {index + 1}</h5>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveServicePoint(sp.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={sp.name}
                    onChange={(e) => handleServicePointChange(sp.id, "name", e.target.value)}
                    placeholder="Service point name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={sp.city}
                    onChange={(e) => handleServicePointChange(sp.id, "city", e.target.value)}
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Street</Label>
                  <Input
                    value={sp.street}
                    onChange={(e) => handleServicePointChange(sp.id, "street", e.target.value)}
                    placeholder="Street name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>House No.</Label>
                  <Input
                    value={sp.houseNumber}
                    onChange={(e) => handleServicePointChange(sp.id, "houseNumber", e.target.value)}
                    placeholder="Nr"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={handleAddServicePoint}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Point
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/entities")}>
          Cancel
        </Button>
        <Button type="submit">{entityId ? "Update Entity" : "Create Entity"}</Button>
      </div>
    </form>
  )
}
