"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  useOrderTypes,
  type WasteTypeSelection,
  type ComplianceModule,
  type LMAReportingMethod,
} from "@/lib/order-types-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SidebarNav } from "./sidebar-nav"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

interface OrderTypeFormProps {
  initialData?: {
    id: string
    name: string
    description?: string
    wasteTypeSelection: WasteTypeSelection
    complianceModule: ComplianceModule
    lmaReportingMethod: LMAReportingMethod | null
  }
}

export function OrderTypeForm({ initialData }: OrderTypeFormProps) {
  const { addOrderType, updateOrderType } = useOrderTypes()
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [wasteTypeSelection, setWasteTypeSelection] = useState<WasteTypeSelection>(
    initialData?.wasteTypeSelection || "none",
  )
  const [complianceModule, setComplianceModule] = useState<ComplianceModule>(initialData?.complianceModule || "none")
  const [lmaReportingMethod, setLmaReportingMethod] = useState<LMAReportingMethod | null>(
    initialData?.lmaReportingMethod || null,
  )

  useEffect(() => {
    if (complianceModule !== "nl_lma") {
      setLmaReportingMethod(null)
    }
  }, [complianceModule])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }

    if (complianceModule === "nl_lma" && !lmaReportingMethod) {
      toast({
        title: "Validation error",
        description: "LMA Reporting Method is required when Compliance Module is Netherlands – LMA",
        variant: "destructive",
      })
      return
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      wasteTypeSelection,
      complianceModule,
      lmaReportingMethod: complianceModule === "nl_lma" ? lmaReportingMethod : null,
    }

    if (initialData) {
      updateOrderType(initialData.id, data)
      toast({
        title: "Order type updated",
        description: `${name} has been updated`,
      })
    } else {
      addOrderType(data)
      toast({
        title: "Order type created",
        description: `${name} has been created`,
      })
    }
    router.push("/settings/order-types")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {initialData ? "Edit Order Type" : "Add Order Type"}
            </h1>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6 bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold">Basic Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Commercial Collection"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-6 bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold">Configuration</h2>

              <div className="space-y-2">
                <Label>Waste Type Selection</Label>
                <RadioGroup
                  value={wasteTypeSelection}
                  onValueChange={(v) => setWasteTypeSelection(v as WasteTypeSelection)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="font-normal">
                      None (Default)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single" className="font-normal">
                      Single
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multiple" id="multiple" />
                    <Label htmlFor="multiple" className="font-normal">
                      Multiple
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceModule">Compliance Module *</Label>
                <Select value={complianceModule} onValueChange={(v) => setComplianceModule(v as ComplianceModule)}>
                  <SelectTrigger id="complianceModule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Default)</SelectItem>
                    <SelectItem value="nl_lma">Netherlands – LMA</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {complianceModule === "nl_lma" && (
                <div className="space-y-2">
                  <Label htmlFor="lmaReportingMethod">LMA Reporting Method *</Label>
                  <Select
                    value={lmaReportingMethod || ""}
                    onValueChange={(v) => setLmaReportingMethod(v as LMAReportingMethod)}
                  >
                    <SelectTrigger id="lmaReportingMethod">
                      <SelectValue placeholder="Select reporting method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic_system">Basic System (Basissystematiek)</SelectItem>
                      <SelectItem value="collectors_schema">Collectors Schema (Inzamelaarsregeling)</SelectItem>
                      <SelectItem value="route_collection">Route Collection (Route-inzameling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/settings/order-types")}>
                Cancel
              </Button>
              <Button type="submit">{initialData ? "Save Changes" : "Create Order Type"}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
