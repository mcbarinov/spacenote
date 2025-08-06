import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Space } from "@/types"

interface FieldsTableProps {
  space: Space
}

export function FieldsTable({ space }: FieldsTableProps) {
  if (!space.fields || space.fields.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No fields defined yet.</p>
        <p className="text-sm text-gray-500">Add fields to customize your space structure.</p>
      </div>
    )
  }

  return (
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
  )
}
