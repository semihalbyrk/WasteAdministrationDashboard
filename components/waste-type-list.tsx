"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/lib/store"

export function WasteTypeList() {
  const { wasteTypes, deleteWasteType } = useApp()

  const handleDelete = (id: string) => {
    if (confirm("Delete this waste type? It will be marked as inactive in existing agreements.")) {
      deleteWasteType(id)
    }
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waste Type Name</TableHead>
            <TableHead>EWC Code</TableHead>
            <TableHead>Hazardous</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wasteTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>
                <code className="text-sm bg-muted px-2 py-1 rounded">{type.ewcCode}</code>
              </TableCell>
              <TableCell>
                {type.hazardous ? (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <Badge variant="destructive" className="text-xs">
                      Yes
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{type.description}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/waste-types/edit/${type.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(type.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
