import { useParams, useNavigate, Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSpacesStore } from "@/stores/spacesStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader } from "@/components/PageHeader"
import { createField } from "@/services/spaceService"
import type { FieldType, SpaceField } from "@/lib/api/spaces"
import { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"

const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Field name must be lowercase, start with a letter, and contain only letters, numbers, and underscores"
    ),
  type: z.enum(["string", "markdown", "boolean", "choice", "tags", "user", "datetime", "int", "float", "image"] as const),
  required: z.boolean().default(false),
})

type FieldFormData = z.infer<typeof fieldSchema>

export default function AddField() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const space = useSpacesStore(state => state.getSpace(spaceId || ""))

  const [choiceValues, setChoiceValues] = useState<string[]>([""])
  const [minValue, setMinValue] = useState<string>("")
  const [maxValue, setMaxValue] = useState<string>("")
  const [defaultValue, setDefaultValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      type: "string",
      required: false,
    },
  })

  const selectedType = form.watch("type")

  // Reset options when type changes
  useEffect(() => {
    setChoiceValues([""])
    setMinValue("")
    setMaxValue("")
    setDefaultValue("")
  }, [selectedType])

  if (!space || !spaceId) {
    return <div className="mt-4">Loading...</div>
  }

  const addChoiceValue = () => {
    setChoiceValues([...choiceValues, ""])
  }

  const removeChoiceValue = (index: number) => {
    setChoiceValues(choiceValues.filter((_, i) => i !== index))
  }

  const updateChoiceValue = (index: number, value: string) => {
    const newValues = [...choiceValues]
    newValues[index] = value
    setChoiceValues(newValues)
  }

  const onSubmit = async (data: FieldFormData) => {
    setIsSubmitting(true)

    try {
      const field: SpaceField = {
        name: data.name,
        type: data.type,
        required: data.required,
        options: {},
        default: null,
      }

      // Handle type-specific options
      if (data.type === "choice" && choiceValues.some(v => v.trim())) {
        field.options.values = choiceValues.filter(v => v.trim()).map(v => v.trim())
      }

      if ((data.type === "int" || data.type === "float") && minValue) {
        field.options.min = data.type === "int" ? parseInt(minValue) : parseFloat(minValue)
      }

      if ((data.type === "int" || data.type === "float") && maxValue) {
        field.options.max = data.type === "int" ? parseInt(maxValue) : parseFloat(maxValue)
      }

      // Handle default value
      if (defaultValue) {
        switch (data.type) {
          case "boolean":
            field.default = defaultValue === "true"
            break
          case "int":
            field.default = parseInt(defaultValue)
            break
          case "float":
            field.default = parseFloat(defaultValue)
            break
          case "tags":
            field.default = defaultValue
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
            break
          default:
            field.default = defaultValue
        }
      }

      await createField(spaceId, field)
      navigate(`/spaces/${spaceId}/fields`)
    } catch (error) {
      console.error("Failed to create field:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case "choice":
        return (
          <div className="space-y-2">
            <Label>Choice Options</Label>
            {choiceValues.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={value}
                  onChange={e => updateChoiceValue(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {choiceValues.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeChoiceValue(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addChoiceValue} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )

      case "int":
      case "float":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Minimum Value</Label>
              <Input
                id="min"
                type="number"
                value={minValue}
                onChange={e => setMinValue(e.target.value)}
                placeholder="Optional"
                step={selectedType === "float" ? "0.01" : "1"}
              />
            </div>
            <div>
              <Label htmlFor="max">Maximum Value</Label>
              <Input
                id="max"
                type="number"
                value={maxValue}
                onChange={e => setMaxValue(e.target.value)}
                placeholder="Optional"
                step={selectedType === "float" ? "0.01" : "1"}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderDefaultValueField = () => {
    switch (selectedType) {
      case "boolean":
        return (
          <Select value={defaultValue} onValueChange={setDefaultValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select default value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No default</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )

      case "choice":
        if (!choiceValues.some(v => v.trim())) return null
        return (
          <Select value={defaultValue} onValueChange={setDefaultValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select default value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No default</SelectItem>
              {choiceValues
                .filter(v => v.trim())
                .map(value => (
                  <SelectItem key={value} value={value.trim()}>
                    {value.trim()}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )

      case "tags":
        return <Input value={defaultValue} onChange={e => setDefaultValue(e.target.value)} placeholder="tag1, tag2, tag3" />

      case "int":
        return (
          <Input
            type="number"
            step="1"
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            placeholder="Optional"
          />
        )

      case "float":
        return (
          <Input
            type="number"
            step="0.01"
            value={defaultValue}
            onChange={e => setDefaultValue(e.target.value)}
            placeholder="Optional"
          />
        )

      case "user":
        return (
          <Select value={defaultValue} onValueChange={setDefaultValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select default user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No default</SelectItem>
              {space.members.map(member => (
                <SelectItem key={member} value={member}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "string":
      case "markdown":
      case "datetime":
        return <Input value={defaultValue} onChange={e => setDefaultValue(e.target.value)} placeholder="Optional" />

      case "image":
        return null // Images don't have meaningful default values

      default:
        return null
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Field"
        subtitle={space.name}
        actions={
          <Button asChild variant="outline">
            <Link to={`/spaces/${spaceId}/fields`}>Cancel</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Field Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Field Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g., task_priority, due_date" />
              {form.formState.errors.name && <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                Must be lowercase, start with a letter, and use only letters, numbers, and underscores
              </p>
            </div>

            <div>
              <Label>Field Type</Label>
              <Select value={form.watch("type")} onValueChange={(value: FieldType) => form.setValue("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">string</SelectItem>
                  <SelectItem value="markdown">markdown</SelectItem>
                  <SelectItem value="boolean">boolean</SelectItem>
                  <SelectItem value="choice">choice</SelectItem>
                  <SelectItem value="tags">tags</SelectItem>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="datetime">datetime</SelectItem>
                  <SelectItem value="int">int</SelectItem>
                  <SelectItem value="float">float</SelectItem>
                  <SelectItem value="image">image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={form.watch("required")}
                onCheckedChange={checked => form.setValue("required", !!checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>

            {renderTypeSpecificFields()}

            <div>
              <Label>Default Value</Label>
              {renderDefaultValueField()}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Field"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/spaces/${spaceId}/fields`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
