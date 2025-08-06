import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { spacesQueryOptions } from "@/lib/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/notes_/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(spacesQueryOptions()),
  component: NotesPage,
})

function NotesPage() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notes</h1>
        <p className="text-gray-600 mt-2">Choose a space to view and manage your notes</p>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No spaces available.</p>
          <p className="text-sm text-gray-500">Create your first space to start taking notes.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Link key={space.id} to="/notes/$spaceId" params={{ spaceId: space.id }}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{space.name}</CardTitle>
                  <CardDescription className="font-mono text-sm">{space.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Click to view notes in this space</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
