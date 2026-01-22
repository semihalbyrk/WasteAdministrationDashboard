"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { useApp } from "@/lib/store"
import { EWC_CODES } from "@/lib/entities"

interface WasteTypeFormProps {
  mode: "create" | "edit"
  initialData?: any
}

export function WasteTypeForm({ mode, initialData }: WasteTypeFormProps) {
  const router = useRouter()
  const { addWasteType, updateWasteType } = useApp()

  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      ewcCode: "",
      description: "",
    },
  )

  const selectedEwc = EWC_CODES.find((ewc) => ewc.code === formData.ewcCode)
  const isHazardous = selectedEwc?.hazardous || false

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.ewcCode) {
      alert("Please fill in required fields")
      return
    }

    const wasteTypeData = {
      name: formData.name,
      ewcCode: formData.ewcCode,
      hazardous: isHazardous,
      description: formData.description,
    }

    if (mode === "create") {
      addWasteType(wasteTypeData)
    } else {
      updateWasteType(initialData?.id, wasteTypeData)
    }

    router.push("/waste-types")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Waste Type Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mixed Municipal Waste"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ewcCode">
              EWC Code <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.ewcCode} onValueChange={(value) => setFormData({ ...formData, ewcCode: value })}>
              <SelectTrigger id="ewcCode">
                <SelectValue placeholder="Select EWC code from NL list" />
              </SelectTrigger>
              <SelectContent>
                {EWC_CODES.map((ewc) => (
                  <SelectItem key={ewc.code} value={ewc.code}>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{ewc.code}</code>
                      <span className="text-muted-foreground">—</span>
                      <span>{ewc.name}</span>
                      {ewc.hazardous && (
                        <Badge variant="destructive" className="text-xs ml-2">
                          Hazardous
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.ewcCode && (
            <div className="space-y-2">
              <Label>Hazardous Classification</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                {isHazardous ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <Badge variant="destructive">Hazardous</Badge>
                  </>
                ) : (
                  <Badge variant="secondary">Non-Hazardous</Badge>
                )}
                <span className="text-sm text-muted-foreground">Auto-derived from EWC Code</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of the waste type"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push("/waste-types")}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.ewcCode}>
              {mode === "create" ? "Create Waste Type" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
