import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { spacesQueryOptions } from "@/lib/queries"

export const Route = createFileRoute("/spaces")({
  loader: ({ context: { queryClient } }) => 
    queryClient.ensureQueryData(spacesQueryOptions()),
  component: SpacesPage,
})

function SpacesPage() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Spaces</h1>
      </div>
      
      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No spaces yet.</p>
          <p className="text-sm text-gray-500">Create your first space to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div key={space.id} className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{space.name}</h3>
              {space.description && (
                <p className="text-gray-600 text-sm mb-4">{space.description}</p>
              )}
              <div className="text-xs text-gray-500">
                Created {new Date(space.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}