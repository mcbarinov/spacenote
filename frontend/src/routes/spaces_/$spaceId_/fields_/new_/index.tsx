import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/spaces_/$spaceId_/fields_/new_/")({
  component: NewFieldPage,
})

function NewFieldPage() {
  const { spaceId } = Route.useParams()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">New Field</h1>
      <p className="text-gray-600">Add a new field to space: {spaceId}</p>
      <div className="mt-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500">Field creation form will be implemented here</p>
      </div>
    </div>
  )
}
