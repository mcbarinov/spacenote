import { useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAddFieldMutation } from "@/lib/queries"
import { useSpace } from "@/hooks/useSpace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { toast } from "sonner"
import type { FieldType, SpaceField } from "@/types"

const fieldTypes: FieldType[] = ["string", "markdown", "boolean", "string_choice", "tags", "user", "datetime", "int", "float"]

const createFieldSchema = z
  .object({
    name: z.string().min(1, "Field name is required"),
    type: z.enum(fieldTypes as [FieldType, ...FieldType[]]),
    required: z.boolean(),
    values: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    defaultString: z.string().optional(),
    defaultBoolean: z.boolean().optional(),
    defaultNumber: z.number().optional(),
    defaultTags: z.string().optional(),
  })
  .refine(
    (data) => {
      if ((data.type === "string_choice" || data.type === "tags") && !data.values?.trim()) {
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
      defaultString: undefined,
      defaultBoolean: false,
      defaultNumber: undefined,
      defaultTags: undefined,
    },
  })

  const watchType = form.watch("type")

  const onSubmit = (data: CreateFieldForm) => {
    const options: Record<string, string[] | number> = {}

    if ((data.type === "string_choice" || data.type === "tags") && data.values) {
      options.values = data.values
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    }

    if (data.type === "int" || data.type === "float") {
      if (data.min !== undefined) options.min = data.min
      if (data.max !== undefined) options.max = data.max
    }

    let defaultValue: string | boolean | string[] | number | undefined = undefined

    switch (data.type) {
      case "string":
      case "markdown":
      case "user":
      case "datetime":
        defaultValue = data.defaultString ?? undefined
        break
      case "boolean":
        defaultValue = data.defaultBoolean
        break
      case "string_choice":
        defaultValue = data.defaultString ?? undefined
        break
      case "tags":
        if (data.defaultTags) {
          defaultValue = data.defaultTags
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        }
        break
      case "int":
      case "float":
        defaultValue = data.defaultNumber
        break
    }

    const fieldData: SpaceField = {
      name: data.name,
      type: data.type,
      required: data.required,
      options: Object.keys(options).length > 0 ? options : {},
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
          className="space-y-4"
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
              <FormItem>
                <FormLabel>Field Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mutation.isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
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

          {(watchType === "string_choice" || watchType === "tags") && (
            <FormField
              control={form.control}
              name="values"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Values (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="option1, option2, option3" {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(watchType === "int" || watchType === "float") && (
            <>
              <FormField
                control={form.control}
                name="min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Value (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={watchType === "float" ? "any" : "1"}
                        {...field}
                        value={field.value ?? ""}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Value (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={watchType === "float" ? "any" : "1"}
                        {...field}
                        value={field.value ?? ""}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {watchType === "string" && (
            <FormField
              control={form.control}
              name="defaultString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Value (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} disabled={mutation.isPending} />
                  </FormControl>
                  <FormDescription>Default value for new notes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchType === "markdown" && (
            <FormField
              control={form.control}
              name="defaultString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Value (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} disabled={mutation.isPending} />
                  </FormControl>
                  <FormDescription>Default markdown content for new notes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchType === "boolean" && (
            <FormField
              control={form.control}
              name="defaultBoolean"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Default to checked</FormLabel>
                    <FormDescription>This field will be checked by default in new notes</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}

          {watchType === "string_choice" && (
            <FormField
              control={form.control}
              name="defaultString"
              render={({ field }) => {
                const values = form.watch("values")
                const valuesList =
                  values
                    ?.split(",")
                    .map((v) => v.trim())
                    .filter(Boolean) ?? []
                return (
                  <FormItem>
                    <FormLabel>Default Value (optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={mutation.isPending || valuesList.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={valuesList.length === 0 ? "Define values first" : "Select default"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {valuesList.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Default selection for new notes</FormDescription>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          )}

          {watchType === "tags" && (
            <FormField
              control={form.control}
              name="defaultTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Tags (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="tag1, tag2, tag3" {...field} value={field.value ?? ""} disabled={mutation.isPending} />
                  </FormControl>
                  <FormDescription>Default tags for new notes (comma separated)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(watchType === "int" || watchType === "float") && (
            <FormField
              control={form.control}
              name="defaultNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Value (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={watchType === "float" ? "any" : "1"}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === "" ? undefined : Number(value))
                      }}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>Default numeric value for new notes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchType === "datetime" && (
            <FormField
              control={form.control}
              name="defaultString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Value (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} disabled={mutation.isPending} />
                  </FormControl>
                  <FormDescription>Default date/time for new notes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Field"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
