import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateHiddenCreateFieldsMutation } from "@/lib/queries"
import { APIError } from "@/lib/errors"
import type { Space } from "@/types"

interface HiddenCreateFieldsEditorProps {
  space: Space
  spaceId: string
}

export function HiddenCreateFieldsEditor({ space, spaceId }: HiddenCreateFieldsEditorProps) {
  const updateHiddenCreateFieldsMutation = useUpdateHiddenCreateFieldsMutation(spaceId)
  const [hiddenCreateFieldsValue, setHiddenCreateFieldsValue] = useState(() => space.hidden_create_fields?.join(", ") || "")

  const handleUpdateHiddenCreateFields = async () => {
    try {
      const fields = hiddenCreateFieldsValue
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f)
      await updateHiddenCreateFieldsMutation.mutateAsync(fields)
      toast.success("Hidden create fields updated successfully")
    } catch (error) {
      const message = error instanceof APIError ? error.message : "Failed to update hidden create fields"
      toast.error(message)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="hiddenCreateFields">Hidden Create Fields</Label>
          <p className="text-sm text-gray-600 mb-2">Field names to hide in the create note form (comma-separated)</p>
          <Input
            id="hiddenCreateFields"
            value={hiddenCreateFieldsValue}
            onChange={(e) => setHiddenCreateFieldsValue(e.target.value)}
            placeholder="e.g. created_at, updated_at"
            className="mb-3"
          />
          <Button onClick={handleUpdateHiddenCreateFields} disabled={updateHiddenCreateFieldsMutation.isPending}>
            {updateHiddenCreateFieldsMutation.isPending ? "Saving..." : "Save Hidden Create Fields"}
          </Button>
        </div>
      </div>
    </div>
  )
}
