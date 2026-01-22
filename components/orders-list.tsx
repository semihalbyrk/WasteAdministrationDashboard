"use client"

import { useState } from "react"
import { useOrders, type OrderStatus } from "@/lib/orders-store"
import { useOrderTypes } from "@/lib/order-types-store"
import { useApp } from "@/lib/store"
import { ALL_ENTITIES, RECEIVERS } from "@/lib/entities"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
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

export function OrdersList() {
  const { orders, updateOrder, deleteOrder } = useOrders()
  const { orderTypes } = useOrderTypes()
  const { wasteTypes } = useApp()

  const [filterEntity, setFilterEntity] = useState<string>("")
  const [filterOrderType, setFilterOrderType] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

  const filteredOrders = orders.filter((order) => {
    if (filterEntity && filterEntity !== "__all__" && order.entityId !== filterEntity) return false
    if (filterOrderType && filterOrderType !== "__all__" && order.orderTypeId !== filterOrderType) return false
    if (filterStatus && filterStatus !== "__all__" && order.status !== filterStatus) return false
    return true
  })

  const getEntityName = (id: string) => {
    return ALL_ENTITIES.find((e) => e.id === id)?.label || id
  }

  const getOrderTypeName = (id: string) => {
    return orderTypes.find((ot) => ot.id === id)?.name || "Unknown"
  }

  const getWasteTypesDisplay = (order: any) => {
    const wasteTypeNames = order.wasteLines.map((wl: any) => {
      const wt = wasteTypes.find((w) => w.id === wl.wasteTypeId)
      return wt ? `${wt.name} (${wt.ewcCode})` : wl.wasteTypeId
    })
    return wasteTypeNames.join(", ") || "—"
  }

  const getReceiversDisplay = (order: any) => {
    const receiverNames = order.wasteLines
      .filter((wl: any) => wl.receiverId)
      .map((wl: any) => {
        const receiver = RECEIVERS.find((r) => r.id === wl.receiverId)
        return receiver?.label || wl.receiverId
      })
    return [...new Set(receiverNames)].join(", ") || "—"
  }

  const getASNDisplay = (order: any) => {
    const asns = order.wasteLines.map((wl: any) => wl.asn).filter(Boolean)
    return [...new Set(asns)].join(", ") || "—"
  }

  const getProcessingMethodDisplay = (order: any) => {
    const methods = order.wasteLines.map((wl: any) => wl.processingMethod).filter(Boolean)
    return [...new Set(methods)].join(", ") || "—"
  }

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrder(orderId, { status: newStatus })
  }

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete)
      setOrderToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Orders</h1>
              <p className="text-sm text-muted-foreground mt-1">Create and manage waste collection orders</p>
            </div>
            <Link href="/orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex-1">
        <div className="flex gap-4 mb-6">
          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Entities</SelectItem>
              {ALL_ENTITIES.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOrderType} onValueChange={setFilterOrderType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Order Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Order Types</SelectItem>
              {orderTypes.map((ot) => (
                <SelectItem key={ot.id} value={ot.id}>
                  {ot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="Draft">Nieuw</SelectItem>
              <SelectItem value="Submitted">Afgerond</SelectItem>
            </SelectContent>
          </Select>

          {(filterEntity || filterOrderType || filterStatus) && (
            <Button
              variant="outline"
              onClick={() => {
                setFilterEntity("")
                setFilterOrderType("")
                setFilterStatus("")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {filteredOrders.length === 0 && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-4">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create your first waste collection order</p>
            <Link href="/orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Order
              </Button>
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-4">No orders match your filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setFilterEntity("")
                setFilterOrderType("")
                setFilterStatus("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Name</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fulfillment Date</TableHead>
                  <TableHead>Waste Type(s)</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>ASN</TableHead>
                  <TableHead>Processing Method</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-primary">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.orderName || order.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger
                          className={`w-[110px] h-8 text-xs font-medium ${
                            order.status === "Draft"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-green-50 border-green-200 text-green-700"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Nieuw</SelectItem>
                          <SelectItem value="Submitted">Afgerond</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getOrderTypeName(order.orderTypeId)}</TableCell>
                    <TableCell>
                      {new Date(order.fulfillmentDate).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={getWasteTypesDisplay(order)}>
                      {getWasteTypesDisplay(order)}
                    </TableCell>
                    <TableCell className="text-sm">{getReceiversDisplay(order)}</TableCell>
                    <TableCell className="text-sm">{getASNDisplay(order)}</TableCell>
                    <TableCell className="text-sm">{getProcessingMethodDisplay(order)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteClick(order.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
