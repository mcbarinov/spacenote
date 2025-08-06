import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/notes_/$spaceId_/new")({
  component: NewNotePage,
})

function NewNotePage() {
  const { spaceId } = Route.useParams()

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Note</h1>
        <p className="text-gray-600 mt-2">Space: {spaceId}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Note creation form coming soon</div>
          <div className="text-gray-400 text-sm mt-2">This will be a form to create new notes in the {spaceId} space.</div>
        </div>
      </div>
    </div>
  )
}
