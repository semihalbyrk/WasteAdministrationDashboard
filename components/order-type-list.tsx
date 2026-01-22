"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOrderTypes, getLMAReportingMethodName, getComplianceModuleName } from "@/lib/order-types-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { SidebarNav } from "./sidebar-nav"
import { useToast } from "@/hooks/use-toast"

export function OrderTypeList() {
  const { orderTypes, deleteOrderType } = useOrderTypes()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const filteredOrderTypes = orderTypes.filter((ot) => ot.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDelete = () => {
    if (deleteId) {
      const orderType = orderTypes.find((ot) => ot.id === deleteId)
      deleteOrderType(deleteId)
      toast({
        title: "Order type deleted",
        description: `${orderType?.name} has been deleted`,
      })
      setDeleteId(null)
    }
  }

  const hasLMAColumn = orderTypes.some((ot) => ot.complianceModule === "nl_lma")

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Order Types</h1>
              </div>
              <Button onClick={() => router.push("/settings/order-types/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Order Type
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {orderTypes.length > 0 && (
            <div className="mb-6">
              <Input
                placeholder="Search order types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
          )}

          {orderTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No order types yet.</p>
              <Button onClick={() => router.push("/settings/order-types/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Order Type
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Compliance Module</TableHead>
                    {hasLMAColumn && <TableHead>LMA Reporting Method</TableHead>}
                    <TableHead>Waste Type Selection</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrderTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={hasLMAColumn ? 5 : 4} className="text-center text-muted-foreground py-8">
                        No order types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrderTypes.map((ot) => (
                      <TableRow key={ot.id}>
                        <TableCell className="font-medium">{ot.name}</TableCell>
                        <TableCell>{getComplianceModuleName(ot.complianceModule)}</TableCell>
                        {hasLMAColumn && <TableCell>{getLMAReportingMethodName(ot.lmaReportingMethod)}</TableCell>}
                        <TableCell className="capitalize">{ot.wasteTypeSelection}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/settings/order-types/${ot.id}/edit`)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteId(ot.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order type? This action cannot be undone.
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
    </div>
  )
}
