import { createFileRoute, Link } from "@tanstack/react-router"

import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { FieldsTable } from "./-components/FieldsTable"
import { ListFieldsEditor } from "./-components/ListFieldsEditor"
import { HiddenCreateFieldsEditor } from "./-components/HiddenCreateFieldsEditor"

export const Route = createFileRoute("/spaces_/$spaceId_/fields_/")({
  component: FieldsPage,
})

function FieldsPage() {
  const { spaceId } = Route.useParams()
  const space = useSpace(spaceId)

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fields</h1>
          <p className="text-gray-600 mt-2">Manage fields for {space.name}</p>
        </div>
        <Link to="/spaces/$spaceId/fields/new" params={{ spaceId }}>
          <Button>New Field</Button>
        </Link>
      </div>

      {/* Fields Table */}
      <FieldsTable space={space} />

      {/* Space Configuration Section */}
      <div className="mt-12 space-y-8">
        <h2 className="text-2xl font-semibold">Space Configuration</h2>

        {/* List Fields Editor */}
        <ListFieldsEditor space={space} spaceId={spaceId} />

        {/* Hidden Create Fields Editor */}
        <HiddenCreateFieldsEditor space={space} spaceId={spaceId} />
      </div>
    </div>
  )
}
