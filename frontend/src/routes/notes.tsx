import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/notes")({
  component: NotesPage,
})

function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Notes</h1>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Notes functionality is coming soon!</div>
          <div className="text-gray-400 text-sm mt-2">This feature is currently under development.</div>
        </div>
      </div>
    </div>
  )
}
