import { useState } from "react"
import { useParams } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { spacesQueryOptions, useAddFieldMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { AddFieldRequest, FieldType } from "@/types"

const fieldTypes: FieldType[] = ["string", "markdown", "boolean", "string_choice", "tags", "user", "datetime", "int", "float"]

export default function SpaceFieldNewPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  const space = spaces.find((s) => s.slug === slug)

  const [fieldName, setFieldName] = useState("")
  const [fieldType, setFieldType] = useState<FieldType>("string")
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState<Record<string, unknown>>({})

  const mutation = useAddFieldMutation(slug ?? "")

  if (!space) {
    return <div>Space not found</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const fieldData: AddFieldRequest = {
      field: {
        name: fieldName,
        type: fieldType,
        required,
        ...(Object.keys(options).length > 0 && { options }),
      },
    }

    mutation.mutate(fieldData)
  }

  const renderOptionsFields = () => {
    switch (fieldType) {
      case "string_choice":
      case "tags":
        return (
          <div className="space-y-2">
            <Label htmlFor="values">Values (comma separated)</Label>
            <Input
              id="values"
              value={(options.values as string[] | undefined)?.join(", ") ?? ""}
              onChange={(e) => {
                setOptions({
                  values: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }}
              placeholder="option1, option2, option3"
            />
          </div>
        )
      case "int":
      case "float":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="min">Min Value (optional)</Label>
              <Input
                id="min"
                type="number"
                value={(options.min as number | undefined) ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined
                  setOptions((prev) => (val !== undefined ? { ...prev, min: val } : { ...prev }))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max Value (optional)</Label>
              <Input
                id="max"
                type="number"
                value={(options.max as number | undefined) ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined
                  setOptions((prev) => (val !== undefined ? { ...prev, max: val } : { ...prev }))
                }}
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Field</h1>
        <p className="text-muted-foreground">Add a new field to {space.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Field Name</Label>
          <Input
            id="name"
            value={fieldName}
            onChange={(e) => {
              setFieldName(e.target.value)
            }}
            placeholder="Enter field name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Field Type</Label>
          <Select
            value={fieldType}
            onValueChange={(value) => {
              setFieldType(value as FieldType)
            }}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="required"
            checked={required}
            onCheckedChange={(checked) => {
              setRequired(checked as boolean)
            }}
          />
          <Label htmlFor="required">Required field</Label>
        </div>

        {renderOptionsFields()}

        <div className="flex gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Field"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = `/spaces/${slug ?? ""}/fields`
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
