"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2, Star } from "lucide-react"
import { useApp, type WasteStream } from "@/lib/store"
import { useEntities } from "@/lib/entities-store"

const PROCESSING_METHODS = [
  "Material Recovery",
  "Energy Recovery",
  "Composting",
  "Secure Disposal",
  "Chemical Treatment",
]

const REPORTING_SYSTEMS = ["Basic System", "Collector Scheme", "Route Collection"] as const

interface AgreementFormProps {
  mode: "create" | "edit"
  initialData?: any
}

interface NewWasteStreamData {
  wasteTypeId: string
  receiverRows: Array<{
    tempId: string
    receiverId: string
    asn: string
    processingMethod: string
  }>
}

export function AgreementForm({ mode, initialData }: AgreementFormProps) {
  const router = useRouter()
  const { wasteTypes, addAgreement, updateAgreement } = useApp()
  const { getEntitiesByRole, getServicePointsForEntity, getEntityById } = useEntities()

  const [formData, setFormData] = useState({
    disposerId: initialData?.disposerId || "",
    servicePointId: initialData?.servicePointId || "",
    validFrom: initialData?.validFrom || "",
    validUntil: initialData?.validUntil || "",
    reportingSystem: (initialData?.reportingSystem || "Basic System") as
      | "Basic System"
      | "Collector Scheme"
      | "Route Collection",
    senderId: initialData?.senderId || "",
    transporterId: initialData?.transporterId || "",
  })

  const [wasteStreams, setWasteStreams] = useState<WasteStream[]>(initialData?.wasteStreams || [])
  const [addingWasteStream, setAddingWasteStream] = useState(false)
  const [newWasteStreamData, setNewWasteStreamData] = useState<NewWasteStreamData>({
    wasteTypeId: "",
    receiverRows: [],
  })
  const [defaultSelection, setDefaultSelection] = useState<string>("")

  const disposers = getEntitiesByRole("Disposer")
  const senders = getEntitiesByRole("Sender")
  const transporters = getEntitiesByRole("Transporter")
  const receivers = getEntitiesByRole("Receiver")
  const availableServicePoints = formData.disposerId ? getServicePointsForEntity(formData.disposerId) : []

  const handleDisposerChange = (disposerId: string) => {
    const newServicePoints = getServicePointsForEntity(disposerId)
    setFormData({
      ...formData,
      disposerId,
      servicePointId: newServicePoints.some((sp) => sp.id === formData.servicePointId) ? formData.servicePointId : "",
    })
  }

  const handleWasteTypeChange = (wasteTypeId: string) => {
    const tempId = `temp-${Date.now()}`
    setNewWasteStreamData({
      wasteTypeId,
      receiverRows: [
        {
          tempId,
          receiverId: "",
          asn: "",
          processingMethod: "",
        },
      ],
    })
    setDefaultSelection(tempId)
  }

  const addReceiverRow = () => {
    const newRow = {
      tempId: `temp-${Date.now()}`,
      receiverId: "",
      asn: "",
      processingMethod: "",
    }
    setNewWasteStreamData({
      ...newWasteStreamData,
      receiverRows: [...newWasteStreamData.receiverRows, newRow],
    })
  }

  const removeReceiverRow = (tempId: string) => {
    const updatedRows = newWasteStreamData.receiverRows.filter((row) => row.tempId !== tempId)
    setNewWasteStreamData({
      ...newWasteStreamData,
      receiverRows: updatedRows,
    })
    if (defaultSelection === tempId && updatedRows.length > 0) {
      setDefaultSelection(updatedRows[0].tempId)
    }
  }

  const updateReceiverRow = (tempId: string, field: string, value: string) => {
    setNewWasteStreamData({
      ...newWasteStreamData,
      receiverRows: newWasteStreamData.receiverRows.map((row) =>
        row.tempId === tempId ? { ...row, [field]: value } : row,
      ),
    })
  }

  const addWasteStream = () => {
    const { wasteTypeId, receiverRows } = newWasteStreamData

    if (!wasteTypeId || receiverRows.length === 0) return

    const hasInvalidRow = receiverRows.some((row) => !row.receiverId || !row.processingMethod)
    if (hasInvalidRow) return

    if (receiverRows.length > 1 && !defaultSelection) return

    const isDuplicate = wasteStreams.some((stream) => stream.wasteTypeId === wasteTypeId)
    if (isDuplicate) {
      alert("This Waste Type already exists in this agreement.")
      return
    }

    const newStream: WasteStream = {
      wasteTypeId,
      destinations: receiverRows.map((row) => ({
        id: `dest-${Date.now()}-${Math.random()}`,
        receiverId: row.receiverId,
        asn: row.asn,
        processingMethod: row.processingMethod,
      })),
      defaultDestinationId:
        receiverRows.length === 1
          ? `dest-${Date.now()}-${Math.random()}`
          : receiverRows.find((r) => r.tempId === defaultSelection)?.tempId || receiverRows[0].tempId,
    }

    const defaultIndex = receiverRows.length === 1 ? 0 : receiverRows.findIndex((r) => r.tempId === defaultSelection)
    newStream.defaultDestinationId = newStream.destinations[defaultIndex >= 0 ? defaultIndex : 0].id

    setWasteStreams([...wasteStreams, newStream])
    setAddingWasteStream(false)
    setNewWasteStreamData({ wasteTypeId: "", receiverRows: [] })
    setDefaultSelection("")
  }

  const removeWasteStream = (wasteTypeId: string) => {
    if (confirm("Remove this waste stream and all its receiver destinations?")) {
      setWasteStreams(wasteStreams.filter((s) => s.wasteTypeId !== wasteTypeId))
    }
  }

  const removeDestination = (wasteTypeId: string, destinationId: string) => {
    const streamIndex = wasteStreams.findIndex((s) => s.wasteTypeId === wasteTypeId)
    if (streamIndex === -1) return

    const stream = wasteStreams[streamIndex]

    if (stream.destinations.length === 1) {
      alert("Cannot remove the last receiver. A waste stream must have at least one receiver destination.")
      return
    }

    const updatedStreams = [...wasteStreams]
    updatedStreams[streamIndex].destinations = stream.destinations.filter((d) => d.id !== destinationId)

    if (stream.defaultDestinationId === destinationId) {
      updatedStreams[streamIndex].defaultDestinationId = updatedStreams[streamIndex].destinations[0].id
    }

    setWasteStreams(updatedStreams)
  }

  const setDestinationAsDefault = (wasteTypeId: string, destinationId: string) => {
    const streamIndex = wasteStreams.findIndex((s) => s.wasteTypeId === wasteTypeId)
    if (streamIndex === -1) return

    const updatedStreams = [...wasteStreams]
    updatedStreams[streamIndex].defaultDestinationId = destinationId
    setWasteStreams(updatedStreams)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.disposerId || !formData.validFrom || !formData.reportingSystem) {
      alert("Please fill in all required fields")
      return
    }

    if (!formData.senderId) {
      alert("Sender is required")
      return
    }

    if (!formData.transporterId) {
      alert("Transporter is required")
      return
    }

    if (wasteStreams.length === 0) {
      alert("Please add at least one waste stream")
      return
    }

    const agreementData = {
      ...formData,
      wasteStreams,
    }

    if (mode === "create") {
      addAgreement(agreementData)
    } else {
      updateAgreement(initialData?.id, agreementData)
    }

    router.push("/agreements")
  }

  const isAddWasteStreamValid =
    newWasteStreamData.wasteTypeId &&
    newWasteStreamData.receiverRows.length > 0 &&
    newWasteStreamData.receiverRows.every((row) => row.receiverId && row.processingMethod) &&
    (newWasteStreamData.receiverRows.length === 1 || defaultSelection)

  const getEntityName = (id: string) => {
    const entity = getEntityById(id)
    return entity?.name || id
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Agreement Header</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disposer">
                Disposer (Ontdoener) <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.disposerId} onValueChange={handleDisposerChange}>
                <SelectTrigger id="disposer">
                  <SelectValue placeholder="Select disposer" />
                </SelectTrigger>
                <SelectContent>
                  {disposers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicePoint">Service Point</Label>
              <Select
                value={formData.servicePointId}
                onValueChange={(value) => setFormData({ ...formData, servicePointId: value })}
                disabled={!formData.disposerId || availableServicePoints.length === 0}
              >
                <SelectTrigger id="servicePoint">
                  <SelectValue placeholder={availableServicePoints.length === 0 ? "No service points" : "Optional"} />
                </SelectTrigger>
                <SelectContent>
                  {availableServicePoints.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">
                Valid From <span className="text-destructive">*</span>
              </Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                placeholder="Ongoing if empty"
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Reporting System <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.reportingSystem}
              onValueChange={(value: any) => setFormData({ ...formData, reportingSystem: value })}
              className="flex gap-4"
            >
              {REPORTING_SYSTEMS.map((rs) => (
                <div key={rs} className="flex items-center space-x-2">
                  <RadioGroupItem value={rs} id={rs} />
                  <Label htmlFor={rs} className="font-normal cursor-pointer">
                    {rs}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender">
                Sender (Afzender) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.senderId}
                onValueChange={(value) => setFormData({ ...formData, senderId: value })}
              >
                <SelectTrigger id="sender" className={!formData.senderId ? "border-destructive" : ""}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="transporter">
                Transporter (Transporteur) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.transporterId}
                onValueChange={(value) => setFormData({ ...formData, transporterId: value })}
              >
                <SelectTrigger id="transporter" className={!formData.transporterId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select transporter" />
                </SelectTrigger>
                <SelectContent>
                  {transporters.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Waste Streams</CardTitle>
            <Button type="button" onClick={() => setAddingWasteStream(true)} size="sm" disabled={addingWasteStream}>
              <Plus className="h-4 w-4 mr-2" />
              Add Waste Stream
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {addingWasteStream && (
            <Card className="border-primary bg-accent/50">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newWasteType">
                    Waste Type (Afvaltype) <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newWasteStreamData.wasteTypeId} onValueChange={handleWasteTypeChange}>
                    <SelectTrigger
                      id="newWasteType"
                      className={!newWasteStreamData.wasteTypeId ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select from master data" />
                    </SelectTrigger>
                    <SelectContent>
                      {wasteTypes.map((wt) => (
                        <SelectItem key={wt.id} value={wt.id}>
                          <div className="flex items-center gap-2">
                            <span>{wt.name}</span>
                            <code className="text-xs text-muted-foreground">({wt.ewcCode})</code>
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
                </div>

                {newWasteStreamData.wasteTypeId && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>
                        Receiver Destinations (Ontvangers) <span className="text-destructive">*</span>
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addReceiverRow}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Another Receiver
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {newWasteStreamData.receiverRows.map((row) => {
                        const isOnlyRow = newWasteStreamData.receiverRows.length === 1
                        const hasMultipleRows = newWasteStreamData.receiverRows.length > 1
                        const isInvalid = !row.receiverId || !row.processingMethod
                        const isDefault = isOnlyRow || defaultSelection === row.tempId

                        return (
                          <div
                            key={row.tempId}
                            className={`p-4 border rounded-lg space-y-3 ${isDefault ? "bg-green-50 border-green-200" : "bg-background"} ${isInvalid ? "border-destructive bg-destructive/5" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {hasMultipleRows && (
                                  <RadioGroup value={defaultSelection} onValueChange={setDefaultSelection}>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value={row.tempId} id={`default-${row.tempId}`} />
                                      <Label htmlFor={`default-${row.tempId}`} className="text-xs cursor-pointer">
                                        Default
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                )}
                                {isOnlyRow && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1 fill-green-600 text-green-600" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeReceiverRow(row.tempId)}
                                disabled={isOnlyRow}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>
                                  Receiver (Ontvanger) <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={row.receiverId}
                                  onValueChange={(value) => updateReceiverRow(row.tempId, "receiverId", value)}
                                >
                                  <SelectTrigger className={!row.receiverId ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {receivers.map((r) => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>ASN</Label>
                                <Input
                                  value={row.asn}
                                  onChange={(e) => updateReceiverRow(row.tempId, "asn", e.target.value)}
                                  placeholder="Optional"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>
                                  Processing Method <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={row.processingMethod}
                                  onValueChange={(value) => updateReceiverRow(row.tempId, "processingMethod", value)}
                                >
                                  <SelectTrigger className={!row.processingMethod ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PROCESSING_METHODS.map((pm) => (
                                      <SelectItem key={pm} value={pm}>
                                        {pm}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="button" onClick={addWasteStream} disabled={!isAddWasteStreamValid}>
                        Save Waste Stream
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAddingWasteStream(false)
                          setNewWasteStreamData({ wasteTypeId: "", receiverRows: [] })
                          setDefaultSelection("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {wasteStreams.length === 0 && !addingWasteStream && (
            <div className="text-center py-8 text-muted-foreground">
              No waste streams added yet. Click "Add Waste Stream" to begin.
            </div>
          )}

          {wasteStreams.map((stream) => {
            const wasteType = wasteTypes.find((wt) => wt.id === stream.wasteTypeId)
            return (
              <Card key={stream.wasteTypeId} className="border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wasteType?.name || stream.wasteTypeId}</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{wasteType?.ewcCode}</code>
                      {wasteType?.hazardous && (
                        <Badge variant="destructive" className="text-xs">
                          Hazardous
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWasteStream(stream.wasteTypeId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stream.destinations.map((dest) => {
                      const isDefault = dest.id === stream.defaultDestinationId
                      return (
                        <div
                          key={dest.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isDefault ? "bg-green-50 border-green-200" : "bg-muted/30"}`}
                        >
                          <div className="flex items-center gap-4">
                            {isDefault && <Star className="h-4 w-4 fill-green-600 text-green-600" />}
                            <span className="font-medium">{getEntityName(dest.receiverId)}</span>
                            {dest.asn && <code className="text-xs bg-muted px-2 py-1 rounded">{dest.asn}</code>}
                            <span className="text-sm text-muted-foreground">{dest.processingMethod}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isDefault && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDestinationAsDefault(stream.wasteTypeId, dest.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDestination(stream.wasteTypeId, dest.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" size="lg">
          {mode === "create" ? "Create Agreement" : "Update Agreement"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/agreements")}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
