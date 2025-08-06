import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useCreateFieldMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { FieldType, FieldOption, FieldValue, FieldOptionValue, SpaceField } from "@/types"

interface FormData {
  name: string
  type: FieldType
  required: boolean
  defaultValue: string
  choiceValues: string
  minValue: string
  maxValue: string
}

const FIELD_TYPES: FieldType[] = ["string", "markdown", "boolean", "choice", "tags", "user", "datetime", "int", "float", "image"]

export const Route = createFileRoute("/spaces_/$spaceId_/fields_/new")({
  component: NewFieldPage,
})

function NewFieldPage() {
  const { spaceId } = Route.useParams()
  const navigate = useNavigate()
  const mutation = useCreateFieldMutation(spaceId)

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      type: "string",
      required: false,
      defaultValue: "",
      choiceValues: "",
      minValue: "",
      maxValue: "",
    },
  })

  const selectedType = form.watch("type")

  const onSubmit = async (data: FormData) => {
    const options: Partial<Record<FieldOption, FieldOptionValue>> = {}
    let defaultValue: FieldValue = null

    // Handle choice values
    if (data.type === "choice" && data.choiceValues.trim()) {
      options["values"] = data.choiceValues
        .split("\n")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    }

    // Handle numeric min/max
    if (data.type === "int" || data.type === "float") {
      if (data.minValue) {
        const minVal = data.type === "int" ? parseInt(data.minValue) : parseFloat(data.minValue)
        if (!isNaN(minVal)) {
          options["min"] = minVal
        }
      }
      if (data.maxValue) {
        const maxVal = data.type === "int" ? parseInt(data.maxValue) : parseFloat(data.maxValue)
        if (!isNaN(maxVal)) {
          options["max"] = maxVal
        }
      }
    }

    // Handle default value based on type
    if (data.defaultValue) {
      switch (data.type) {
        case "boolean":
          defaultValue = data.defaultValue.toLowerCase() === "true"
          break
        case "int": {
          const intVal = parseInt(data.defaultValue)
          defaultValue = !isNaN(intVal) ? intVal : null
          break
        }
        case "float": {
          const floatVal = parseFloat(data.defaultValue)
          defaultValue = !isNaN(floatVal) ? floatVal : null
          break
        }
        case "tags":
          defaultValue = data.defaultValue
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0)
          break
        default:
          defaultValue = data.defaultValue
      }
    }

    const field: SpaceField = {
      name: data.name,
      type: data.type,
      required: data.required,
      options,
      default: defaultValue,
    }

    try {
      await mutation.mutateAsync(field)
      toast.success("Field created successfully!")
      navigate({ to: "/spaces/$spaceId/fields", params: { spaceId } })
    } catch (error) {
      console.error("Failed to create field:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create field")
    }
  }

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case "choice":
        return (
          <FormField
            control={form.control}
            name="choiceValues"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Choice Options</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="min-h-20"
                  />
                </FormControl>
                <FormDescription>Enter each option on a new line</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "int":
      case "float":
        return (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Value</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step={selectedType === "float" ? "0.01" : "1"} placeholder="Optional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Value</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step={selectedType === "float" ? "0.01" : "1"} placeholder="Optional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      default:
        return null
    }
  }

  const getDefaultValuePlaceholder = () => {
    switch (selectedType) {
      case "boolean":
        return "true or false"
      case "int":
        return "42"
      case "float":
        return "3.14"
      case "tags":
        return "tag1, tag2, tag3"
      case "datetime":
        return "2023-12-25T10:30:00"
      default:
        return "Default value (optional)"
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Field</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Field name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., priority, status, description" />
                    </FormControl>
                    <FormDescription>A unique name for this field (lowercase, no spaces)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a field type" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required Field</FormLabel>
                      <FormDescription>Users must provide a value for this field</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {renderTypeSpecificFields()}

              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={getDefaultValuePlaceholder()} />
                    </FormControl>
                    <FormDescription>Optional default value for new notes</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/spaces/$spaceId/fields", params: { spaceId } })}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creating..." : "Create Field"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
