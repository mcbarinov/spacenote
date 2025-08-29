import { Link, useParams } from "react-router"
import { useSpace } from "@/hooks/useSpace"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function FieldList() {
  const { slug } = useParams() as { slug: string }
  const space = useSpace(slug)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{space.title} - Fields</h1>
          <p className="text-muted-foreground">Manage fields for this space</p>
        </div>
        <Button asChild>
          <Link to={`/spaces/${slug}/fields/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New Field
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Options</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {space.fields.map((field) => (
            <TableRow key={field.name}>
              <TableCell className="font-medium">{field.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{field.type}</Badge>
              </TableCell>
              <TableCell>{field.required ? "Yes" : "No"}</TableCell>
              <TableCell>
                {field.default !== undefined && field.default !== null && (
                  <span className="text-sm">
                    {Array.isArray(field.default)
                      ? field.default.join(", ")
                      : typeof field.default === "boolean"
                        ? field.default
                          ? "true"
                          : "false"
                        : String(field.default)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {field.options && Object.keys(field.options).length > 0 && (
                  <span className="text-sm text-muted-foreground">{JSON.stringify(field.options)}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
