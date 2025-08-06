import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateListFieldsMutation } from "@/lib/queries"
import { APIError } from "@/lib/errors"
import type { Space } from "@/types"

interface ListFieldsEditorProps {
  space: Space
  spaceId: string
}

export function ListFieldsEditor({ space, spaceId }: ListFieldsEditorProps) {
  const updateListFieldsMutation = useUpdateListFieldsMutation(spaceId)
  const [listFieldsValue, setListFieldsValue] = useState(() => space.list_fields?.join(", ") || "")

  const handleUpdateListFields = async () => {
    try {
      const fields = listFieldsValue
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f)
      await updateListFieldsMutation.mutateAsync(fields)
      toast.success("List fields updated successfully")
    } catch (error) {
      const message = error instanceof APIError ? error.message : "Failed to update list fields"
      toast.error(message)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="listFields">List Fields</Label>
          <p className="text-sm text-gray-600 mb-2">Field names to display in the notes list view (comma-separated)</p>
          <Input
            id="listFields"
            value={listFieldsValue}
            onChange={(e) => setListFieldsValue(e.target.value)}
            placeholder="e.g. title, status, priority"
            className="mb-3"
          />
          <Button onClick={handleUpdateListFields} disabled={updateListFieldsMutation.isPending}>
            {updateListFieldsMutation.isPending ? "Saving..." : "Save List Fields"}
          </Button>
        </div>
      </div>
    </div>
  )
}
