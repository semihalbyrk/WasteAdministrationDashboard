"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Calendar, MoreHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp } from "@/lib/store"
import { useEntities } from "@/lib/entities-store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

export function WasteStreamGroupList() {
  const { agreements, wasteTypes, updateAgreement, deleteAgreement } = useApp()
  const { getEntityById, getServicePointsForEntity } = useEntities()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const groupedAgreements = agreements.reduce(
    (acc, agreement) => {
      const key = agreement.disposerId
      if (!acc[key]) {
        acc[key] = {
          disposerId: agreement.disposerId,
          agreements: [],
        }
      }
      acc[key].agreements.push(agreement)
      return acc
    },
    {} as Record<
      string,
      {
        disposerId: string
        agreements: typeof agreements
      }
    >,
  )

  const groups = Object.values(groupedAgreements)

  const handleDelete = () => {
    if (deleteId) {
      deleteAgreement(deleteId)
      setDeleteId(null)
    }
  }

  if (agreements.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-muted-foreground">No waste stream agreements yet</h3>
          <p className="text-sm text-muted-foreground">Create your first agreement to start managing waste streams</p>
          <Link href="/agreements/new">
            <Button className="mt-4">Add Waste Stream Agreement</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <Accordion type="multiple" className="space-y-4">
          {groups.map((group) => {
            const disposer = getEntityById(group.disposerId)
            const disposerLabel = disposer?.name || group.disposerId

            return (
              <AccordionItem
                key={group.disposerId}
                value={group.disposerId}
                className="border border-border bg-card rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="hover:bg-muted/50 px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-6 text-left">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground text-base">{disposerLabel}</div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-4 pt-2">
                  <div className="space-y-3">
                    {group.agreements.map((agreement) => {
                      const servicePoints = getServicePointsForEntity(agreement.disposerId)
                      const servicePoint = servicePoints.find((sp) => sp.id === agreement.servicePointId)
                      const servicePointLabel = servicePoint?.name || "No Service Point"

                      const sender = getEntityById(agreement.senderId)
                      const transporter = getEntityById(agreement.transporterId)

                      return (
                        <Card key={agreement.id} className="p-4 bg-card">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">
                                    {agreement.validFrom} – {agreement.validUntil || "Ongoing"}
                                  </span>
                                </div>

                                <Select
                                  value={agreement.status}
                                  onValueChange={(value: "Active" | "Inactive") =>
                                    updateAgreement(agreement.id, { status: value })
                                  }
                                >
                                  <SelectTrigger className="w-[120px] h-7">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Badge variant="secondary" className="text-xs">
                                  {agreement.reportingSystem}
                                </Badge>
                              </div>

                              <div className="text-sm text-muted-foreground">{servicePointLabel}</div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Sender</div>
                                  <div className="text-foreground">{sender?.name || "—"}</div>
                                </div>

                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Transporter</div>
                                  <div className="text-foreground">{transporter?.name || "—"}</div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t">
                                {agreement.wasteStreams.map((wasteStream) => {
                                  const wasteType = wasteTypes.find((wt) => wt.id === wasteStream.wasteTypeId)
                                  if (!wasteType) return null

                                  return (
                                    <div
                                      key={wasteStream.wasteTypeId}
                                      className="p-3 rounded-lg border border-border bg-muted/30"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">{wasteType.name}</span>
                                          <Badge variant="outline" className="font-mono text-xs">
                                            {wasteType.ewcCode}
                                          </Badge>
                                          {wasteType.hazardous && (
                                            <Badge variant="destructive" className="text-xs">
                                              Hazardous
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1 ml-2">
                                        {wasteStream.destinations.map((dest) => {
                                          const receiver = getEntityById(dest.receiverId)
                                          const receiverLabel = receiver?.name || dest.receiverId
                                          const isDefault = wasteStream.defaultDestinationId === dest.id

                                          return (
                                            <div
                                              key={dest.id}
                                              className={`flex items-center justify-between text-xs p-2 rounded ${isDefault ? "bg-green-50" : "bg-background"}`}
                                            >
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className="flex items-center gap-1.5 min-w-[180px]">
                                                  {isDefault && (
                                                    <Star className="h-3 w-3 fill-green-600 text-green-600" />
                                                  )}
                                                  <span className="font-medium">{receiverLabel}</span>
                                                </div>
                                                {dest.asn && (
                                                  <>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="font-mono text-muted-foreground min-w-[140px]">
                                                      ASN: {dest.asn}
                                                    </span>
                                                  </>
                                                )}
                                                <span className="text-muted-foreground">{dest.processingMethod}</span>
                                              </div>
                                              {isDefault && (
                                                <Badge
                                                  variant="outline"
                                                  className="border-green-600 text-green-600 text-xs"
                                                >
                                                  Default
                                                </Badge>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/agreements/edit/${agreement.id}`}>Edit Agreement</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteId(agreement.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Agreement
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agreement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agreement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
