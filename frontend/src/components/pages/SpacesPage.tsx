import { useSuspenseQuery } from "@tanstack/react-query"
import { spacesQueryOptions } from "@/lib/queries"
import { Link } from "react-router"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function SpacesPage() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <Button asChild>
          <Link to="/spaces/new">
            <Plus className="h-4 w-4 mr-2" />
            New Space
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spaces.map((space) => (
            <TableRow key={space.id}>
              <TableCell className="font-medium">{space.slug}</TableCell>
              <TableCell>{space.title}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
