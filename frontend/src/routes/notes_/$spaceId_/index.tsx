import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { spaceNotesQueryOptions, spacesQueryOptions } from "@/lib/queries"
import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const Route = createFileRoute("/notes_/$spaceId_/")({
  loader: ({ context: { queryClient }, params: { spaceId } }) =>
    Promise.all([
      queryClient.ensureQueryData(spacesQueryOptions()),
      queryClient.ensureQueryData(spaceNotesQueryOptions(spaceId)),
    ]),
  component: SpaceNotesPage,
})

function SpaceNotesPage() {
  const { spaceId } = Route.useParams()
  const space = useSpace(spaceId)
  const { data: paginationResult } = useSuspenseQuery(spaceNotesQueryOptions(spaceId))

  const { notes } = paginationResult

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-gray-600 mt-2">{space.name}</p>
        </div>
        <Link to="/notes/$spaceId/new" params={{ spaceId }}>
          <Button>Create New Note</Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No notes yet.</p>
          <p className="text-sm text-gray-500 mb-4">Create your first note to get started.</p>
          <Link to="/notes/$spaceId/new" params={{ spaceId }}>
            <Button>Create New Note</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {space.list_fields.length > 0 ? (
                  space.list_fields.map((fieldName) => <TableHead key={fieldName}>{fieldName}</TableHead>)
                ) : (
                  <>
                    <TableHead>ID</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Created</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow key={note.id}>
                  {space.list_fields.length > 0 ? (
                    space.list_fields.map((fieldName) => {
                      // Handle system fields
                      if (fieldName === "id") {
                        return (
                          <TableCell key={fieldName} className="font-mono text-sm">
                            #{note.id}
                          </TableCell>
                        )
                      } else if (fieldName === "author") {
                        return <TableCell key={fieldName}>{note.author}</TableCell>
                      } else if (fieldName === "created_at") {
                        return (
                          <TableCell key={fieldName} className="text-gray-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </TableCell>
                        )
                      } else if (fieldName === "edited_at") {
                        return (
                          <TableCell key={fieldName} className="text-gray-500">
                            {note.edited_at ? new Date(note.edited_at).toLocaleDateString() : "—"}
                          </TableCell>
                        )
                      } else if (fieldName === "comment_count") {
                        return <TableCell key={fieldName}>{note.comment_count}</TableCell>
                      } else if (fieldName === "last_comment_at") {
                        return (
                          <TableCell key={fieldName} className="text-gray-500">
                            {note.last_comment_at ? new Date(note.last_comment_at).toLocaleDateString() : "—"}
                          </TableCell>
                        )
                      } else {
                        // Regular field from fields object
                        return <TableCell key={fieldName}>{note.fields[fieldName]?.toString() || "—"}</TableCell>
                      }
                    })
                  ) : (
                    <>
                      <TableCell className="font-mono text-sm">#{note.id}</TableCell>
                      <TableCell>{note.author}</TableCell>
                      <TableCell className="text-gray-500">{new Date(note.created_at).toLocaleDateString()}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
