import { useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateNoteMutation } from "@/lib/queries"
import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { SpaceField } from "@/types"

// Create dynamic schema based on space fields
const createNoteSchema = (fields: SpaceField[]) => {
  const shape: Record<string, z.ZodString> = {}

  fields.forEach((field) => {
    if (field.required) {
      shape[field.name] = z.string().min(1, `${field.name} is required`)
    } else {
      shape[field.name] = z.string().optional().default("")
    }
  })

  return z.object(shape)
}

export default function NoteNewPage() {
  const { slug } = useParams() as { slug: string }
  const navigate = useNavigate()
  const space = useSpace(slug)
  const mutation = useCreateNoteMutation(slug)

  // Create form schema based on space fields
  const formSchema = createNoteSchema(space.fields)
  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: space.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = field.default?.toString() ?? ""
      return acc
    }, {}),
  })

  const onSubmit = (data: FormData) => {
    // Convert all values to strings for raw_fields
    const raw_fields: Record<string, string> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (value && value !== "") {
        raw_fields[key] = value
      }
    })

    mutation.mutate(
      { raw_fields },
      {
        onSuccess: () => {
          toast.success("Note created successfully")
          void navigate(`/s/${slug}`)
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to create note"
          toast.error(message)
        },
      }
    )
  }

  const renderField = (field: SpaceField) => {
    // Skip fields that should be hidden in create forms
    if (space.hidden_create_fields.includes(field.name)) {
      return null
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>{renderInput(field, formField)}</FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderInput = (field: SpaceField, formField: any) => {
    switch (field.type) {
      case "string":
        return <Input {...formField} />

      case "markdown":
        return <Textarea {...formField} rows={6} />

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              checked={formField.value === "true"}
              onCheckedChange={(checked) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                formField.onChange(checked ? "true" : "false")
              }}
            />
            <span>Yes</span>
          </div>
        )

      case "string_choice":
        if (field.options.values && Array.isArray(field.options.values)) {
          return (
            <Select
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
              value={formField.value}
              onValueChange={(value) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                formField.onChange(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options.values.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        return <Input {...formField} />

      case "tags":
        return <Input {...formField} placeholder="Enter tags separated by commas" />

      case "user":
        return <Input {...formField} placeholder="Enter username" />

      case "datetime":
        return <Input {...formField} type="datetime-local" />

      case "int":
        return (
          <Input
            {...formField}
            type="number"
            min={field.options.min as number | undefined}
            max={field.options.max as number | undefined}
          />
        )

      case "float":
        return (
          <Input
            {...formField}
            type="number"
            step="0.01"
            min={field.options.min as number | undefined}
            max={field.options.max as number | undefined}
          />
        )

      default:
        return <Input {...formField} />
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Note in {space.title}</h1>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e)
          }}
          className="space-y-4 max-w-2xl"
        >
          {space.fields.map(renderField)}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Note"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigate(`/s/${slug}`)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
