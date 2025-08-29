import { useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAddFieldMutation } from "@/lib/queries"
import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { FieldType, SpaceField } from "@/types"

import { FieldTypeSelector } from "./-components/FieldTypeSelector"
import { FieldOptionsConfig } from "./-components/FieldOptionsConfig"
import { FieldDefaultValue } from "./-components/FieldDefaultValue"
import { FIELD_TYPES, formatFieldOptions, parseCommaSeparatedValues } from "./-components/fieldTypeConfigs"

const createFieldSchema = z
  .object({
    name: z.string().min(1, "Field name is required"),
    type: z.enum(FIELD_TYPES as [FieldType, ...FieldType[]]),
    required: z.boolean(),
    values: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    defaultValue: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "string_choice" && !data.values?.trim()) {
        return false
      }
      return true
    },
    {
      message: "Values are required for choice and tags fields",
      path: ["values"],
    }
  )
  .refine(
    (data) => {
      if ((data.type === "int" || data.type === "float") && data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max
      }
      return true
    },
    {
      message: "Min value must be less than or equal to max value",
      path: ["min"],
    }
  )

type CreateFieldForm = z.infer<typeof createFieldSchema>

export default function CreateField() {
  const { slug } = useParams() as { slug: string }
  const navigate = useNavigate()
  const space = useSpace(slug)
  const mutation = useAddFieldMutation(slug)

  const form = useForm<CreateFieldForm>({
    resolver: zodResolver(createFieldSchema),
    defaultValues: {
      name: "",
      type: "string",
      required: false,
      values: undefined,
      min: undefined,
      max: undefined,
      defaultValue: undefined,
    },
  })

  const watchType = form.watch("type")

  const onSubmit = (data: CreateFieldForm) => {
    const options = formatFieldOptions(data.type, data.values, data.min, data.max)

    let defaultValue: string | boolean | string[] | number | undefined = undefined

    if (data.defaultValue !== undefined) {
      switch (data.type) {
        case "boolean":
          defaultValue = data.defaultValue as boolean
          break
        case "tags":
          if (typeof data.defaultValue === "string" && data.defaultValue) {
            defaultValue = parseCommaSeparatedValues(data.defaultValue)
          }
          break
        case "int":
        case "float":
          defaultValue = data.defaultValue as number
          break
        default:
          defaultValue = data.defaultValue as string
          break
      }
    }

    const fieldData: SpaceField = {
      name: data.name,
      type: data.type,
      required: data.required,
      options,
      ...(defaultValue !== undefined && { default: defaultValue }),
    }

    mutation.mutate(fieldData, {
      onSuccess: () => {
        toast.success("Field added successfully")
        void navigate(`/spaces/${slug}/fields`)
      },
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Field</h1>
        <p className="text-muted-foreground">Add a new field to {space.title}</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit(onSubmit)()
          }}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter field name" {...field} disabled={mutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FieldTypeSelector value={field.value} onChange={field.onChange} disabled={mutation.isPending} />
            )}
          />

          <FormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Required field</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FieldOptionsConfig fieldType={watchType} form={form} disabled={mutation.isPending} />

          <FieldDefaultValue fieldType={watchType} form={form} disabled={mutation.isPending} />

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Field"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
