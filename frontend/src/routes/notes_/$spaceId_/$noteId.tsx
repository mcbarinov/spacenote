import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/notes_/$spaceId_/$noteId")({
  component: ViewNotePage,
})

function ViewNotePage() {
  const { spaceId, noteId } = Route.useParams()

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Note #{noteId}</h1>
        <p className="text-gray-600 mt-2">Space: {spaceId}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Note details coming soon</div>
          <div className="text-gray-400 text-sm mt-2">This will show the full note content and allow editing.</div>
        </div>
      </div>
    </div>
  )
}
