import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/notes_/$spaceId_/")({
  component: SpaceNotesPage,
})

function SpaceNotesPage() {
  const { spaceId } = Route.useParams()

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notes in {spaceId}</h1>
        <p className="text-gray-600 mt-2">Notes functionality coming soon</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Space: {spaceId}</div>
          <div className="text-gray-400 text-sm mt-2">Notes listing and creation will be implemented here.</div>
        </div>
      </div>
    </div>
  )
}
