import { useParams, Link } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useSpace } from "@/hooks/useSpace"
import { notesQueryOptions } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import type { Note } from "@/types"

export default function NoteList() {
  const { slug } = useParams() as { slug: string }
  const space = useSpace(slug)
  const { data: notes } = useSuspenseQuery(notesQueryOptions(slug))

  // Determine which columns to show
  const columns = space.list_fields.length > 0 ? space.list_fields : ["number", "created_at", "author_id"]

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Helper function to get field value for display
  const getFieldValue = (note: Note, fieldName: string) => {
    // Handle special fields
    if (fieldName === "number") return note.number
    if (fieldName === "created_at") return formatDate(note.created_at)
    if (fieldName === "author_id") return note.author_id
    if (fieldName === "edited_at") return note.edited_at ? formatDate(note.edited_at) : "-"

    // Handle custom fields
    const fieldValue = note.fields[fieldName]

    if (fieldValue == null) return "-"
    if (typeof fieldValue === "boolean") return fieldValue ? "Yes" : "No"
    if (Array.isArray(fieldValue)) return fieldValue.join(", ")
    if (typeof fieldValue === "object") return JSON.stringify(fieldValue)

    return String(fieldValue)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{space.title}</h1>
        <Link to={`/s/${slug}/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-muted-foreground">No notes yet. Create your first note!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    {columns.map((column) => (
                      <TableCell key={column}>{getFieldValue(note, column)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
