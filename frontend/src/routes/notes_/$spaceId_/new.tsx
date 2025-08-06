import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { spacesQueryOptions, useCreateNoteMutation } from "@/lib/queries"
import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/notes_/$spaceId_/new")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(spacesQueryOptions()),
  component: NewNotePage,
})

function NewNotePage() {
  const { spaceId } = Route.useParams()
  const navigate = useNavigate()
  const space = useSpace(spaceId)
  const createNoteMutation = useCreateNoteMutation(spaceId)

  const [fields, setFields] = useState<Record<string, string>>({})

  const visibleFields = space.fields.filter((field) => !space.hidden_create_fields.includes(field.name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createNoteMutation.mutateAsync(fields)
      await navigate({ to: "/notes/$spaceId", params: { spaceId } })
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Note</h1>
        <p className="text-gray-600 mt-2">{space.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Note Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {visibleFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type="text"
                  value={fields[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={`Enter ${field.name}`}
                />
                <p className="text-sm text-gray-500">Type: {field.type}</p>
              </div>
            ))}

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={createNoteMutation.isPending}>
                {createNoteMutation.isPending ? "Creating..." : "Create Note"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/notes/$spaceId", params: { spaceId } })}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
