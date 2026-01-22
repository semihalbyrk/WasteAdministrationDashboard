"use client"

import { useEntities } from "@/lib/entities-store"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, MoreVertical, Building2 } from "lucide-react"
import Link from "next/link"
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
import { useState } from "react"
import { toast } from "sonner"

export function EntitiesList() {
  const { entities, deleteEntity } = useEntities()
  const { agreements } = useApp()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = () => {
    if (deleteId) {
      const isReferenced = agreements.some(
        (agr) =>
          agr.disposerId === deleteId ||
          agr.senderId === deleteId ||
          agr.transporterId === deleteId ||
          agr.wasteStreams.some((ws) => ws.destinations.some((d) => d.receiverId === deleteId)),
      )

      if (isReferenced) {
        setDeleteError("Cannot delete this entity because it is referenced in one or more Waste Stream Agreements.")
        return
      }

      const result = deleteEntity(deleteId)
      if (result.success) {
        toast.success("Entity deleted successfully")
        setDeleteId(null)
      } else {
        setDeleteError(result.error || "Failed to delete entity")
      }
    }
  }

  if (entities.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No entities yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started by creating your first entity</p>
          </div>
          <Link href="/entities/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Entities ({entities.length})</h2>
          <p className="text-sm text-muted-foreground">Companies and organizations in the system</p>
        </div>
        <Link href="/entities/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Company Name</th>
              <th className="text-left p-4 font-medium text-sm">Entity Type</th>
              <th className="text-left p-4 font-medium text-sm">Roles</th>
              <th className="text-left p-4 font-medium text-sm">City</th>
              <th className="text-left p-4 font-medium text-sm">KVK Number</th>
              <th className="text-left p-4 font-medium text-sm">VIHB Number</th>
              <th className="text-right p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entities.map((entity) => (
              <tr key={entity.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{entity.name}</span>
                    {entity.isDefaultInternalCollector && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Default Collector
                      </Badge>
                    )}
                    {entity.isTenant && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                        Tenant
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{entity.entityType}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {entity.roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{entity.city}</td>
                <td className="p-4 text-muted-foreground font-mono text-sm">{entity.kvkNumber}</td>
                <td className="p-4 text-muted-foreground font-mono text-sm">{entity.vihbNumber || "—"}</td>
                <td className="p-4">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/entities/${entity.id}/edit`} className="flex items-center cursor-pointer">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteId(entity.id)
                            setDeleteError(null)
                          }}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => {
          setDeleteId(null)
          setDeleteError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteError ? "Cannot Delete Entity" : "Delete Entity"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError || "Are you sure you want to delete this entity? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
