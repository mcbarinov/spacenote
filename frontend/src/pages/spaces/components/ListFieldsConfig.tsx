import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SpaceField } from "@/lib/api/spaces"
import { updateListFields } from "@/services/spaceService"

interface ListFieldsConfigProps {
  spaceId: string
  initialFields: string[]
  availableFields: SpaceField[]
}

export function ListFieldsConfig({ spaceId, initialFields, availableFields }: ListFieldsConfigProps) {
  const [listFields, setListFields] = useState(initialFields.join(", "))
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const fieldNames = listFields
        .split(",")
        .map(name => name.trim())
        .filter(name => name.length > 0)

      await updateListFields(spaceId, fieldNames)
    } catch (error) {
      console.error("Failed to update list fields:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>List Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">Enter field names to show in the notes list (comma-separated, order matters):</p>
        <Input value={listFields} onChange={e => setListFields(e.target.value)} placeholder="field1, field2, field3" />
        <p className="text-xs text-gray-500">Available fields: {availableFields.map(f => f.name).join(", ")}</p>
        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleUpdate} disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Update List Fields"}
        </Button>
      </CardContent>
    </Card>
  )
}
