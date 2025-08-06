import { createFileRoute, Link } from "@tanstack/react-router"

import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const Route = createFileRoute("/spaces_/$spaceId_/fields_/")({
  component: FieldsPage,
})

function FieldsPage() {
  const { spaceId } = Route.useParams()
  const space = useSpace(spaceId)

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fields</h1>
          <p className="text-gray-600 mt-2">Manage fields for {space.name}</p>
        </div>
        <Link to="/spaces/$spaceId/fields/new" params={{ spaceId }}>
          <Button>New Field</Button>
        </Link>
      </div>

      {!space.fields || space.fields.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No fields defined yet.</p>
          <p className="text-sm text-gray-500">Add fields to customize your space structure.</p>
        </div>
      ) : (
        <div className="rounded-md border">
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
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">{field.type}</span>
                  </TableCell>
                  <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {field.default !== null && field.default !== undefined ? JSON.stringify(field.default) : "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {field.options && Object.keys(field.options).length > 0 ? JSON.stringify(field.options) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
