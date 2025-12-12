import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { Button, Checkbox, Group, Paper, Select, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import type { FieldType, SpaceField } from "@spacenote/common/types"
import { StringFieldConfig } from "./-components/StringFieldConfig"
import { MarkdownFieldConfig } from "./-components/MarkdownFieldConfig"
import { BooleanFieldConfig } from "./-components/BooleanFieldConfig"
import { SelectFieldConfig } from "./-components/SelectFieldConfig"
import { TagsFieldConfig } from "./-components/TagsFieldConfig"
import { UserFieldConfig } from "./-components/UserFieldConfig"
import { DatetimeFieldConfig } from "./-components/DatetimeFieldConfig"
import { IntFieldConfig } from "./-components/IntFieldConfig"
import { FloatFieldConfig } from "./-components/FloatFieldConfig"
import { ImageFieldConfig } from "./-components/ImageFieldConfig"

export const Route = createFileRoute("/_auth/spaces/$slug/fields/new")({
  component: AddFieldPage,
})

const FIELD_TYPES: FieldType[] = ["string", "markdown", "boolean", "select", "tags", "user", "datetime", "int", "float", "image"]

const addFieldSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name must contain only letters, numbers, hyphens and underscores" }),
  type: z.string().min(1, { message: "Type is required" }),
  required: z.boolean(),
  // Select options
  selectValues: z.array(z.string()),
  valueMaps: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      values: z.record(z.string(), z.string()),
    })
  ),
  // Int/Float options
  minValue: z.number().nullable(),
  maxValue: z.number().nullable(),
  // Image options
  maxWidth: z.number().nullable(),
  // Default value fields (type-specific)
  defaultString: z.string(),
  defaultBoolean: z.boolean().nullable(),
  defaultSelect: z.string().nullable(),
  defaultTags: z.array(z.string()),
  defaultUser: z.string().nullable(),
  defaultDatetime: z.string().nullable(),
  defaultInt: z.number().nullable(),
  defaultFloat: z.number().nullable(),
})

export type FormValues = z.infer<typeof addFieldSchema>

/** Builds options object based on field type */
function buildOptions(values: FormValues): SpaceField["options"] {
  const fieldType = values.type as FieldType

  if (fieldType === "select" && values.selectValues.length > 0) {
    const options: SpaceField["options"] = { values: values.selectValues }

    // Add value_maps if any maps are defined
    if (values.valueMaps.length > 0) {
      const valueMapsObj: Record<string, Record<string, string>> = {}
      for (const map of values.valueMaps) {
        if (map.name) {
          valueMapsObj[map.name] = map.values
        }
      }
      if (Object.keys(valueMapsObj).length > 0) {
        options.value_maps = valueMapsObj
      }
    }

    return options
  }

  if (fieldType === "int" || fieldType === "float") {
    const numOptions: Record<string, number> = {}
    if (values.minValue !== null) numOptions.min = values.minValue
    if (values.maxValue !== null) numOptions.max = values.maxValue
    if (Object.keys(numOptions).length > 0) return numOptions
  }

  if (fieldType === "image" && values.maxWidth !== null) {
    return { max_width: values.maxWidth }
  }

  return {}
}

/** Builds default value based on field type */
function buildDefault(values: FormValues): SpaceField["default"] {
  const fieldType = values.type as FieldType

  switch (fieldType) {
    case "string":
    case "markdown":
      return values.defaultString || null
    case "boolean":
      return values.defaultBoolean
    case "select":
      return values.defaultSelect
    case "tags":
      return values.defaultTags.length > 0 ? values.defaultTags : null
    case "user":
      return values.defaultUser
    case "datetime":
      return values.defaultDatetime
    case "int":
      return values.defaultInt
    case "float":
      return values.defaultFloat
    default:
      return null
  }
}

/** Form to add a new field to a space */
function AddFieldPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const addFieldMutation = api.mutations.useAddField(slug)

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      type: "string",
      required: false,
      selectValues: [],
      valueMaps: [],
      minValue: null,
      maxValue: null,
      maxWidth: null,
      defaultString: "",
      defaultBoolean: null,
      defaultSelect: null,
      defaultTags: [],
      defaultUser: null,
      defaultDatetime: null,
      defaultInt: null,
      defaultFloat: null,
    },
    validate: zod4Resolver(addFieldSchema),
  })

  const fieldType = form.values.type as FieldType

  const handleSubmit = form.onSubmit((values) => {
    const field: SpaceField = {
      name: values.name,
      type: values.type as FieldType,
      required: values.required,
      options: buildOptions(values),
      default: buildDefault(values),
    }

    addFieldMutation.mutate(field, {
      onSuccess: () => {
        notifications.show({ message: "Field added successfully", color: "green" })
        void navigate({ to: "/spaces/$slug/fields", params: { slug } })
      },
    })
  })

  return (
    <Stack gap="md">
      <PageHeader
        title="New Field"
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: `◈ ${space.slug}` }]}
        topActions={<SpaceTabs space={space} />}
      />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Name" placeholder="field_name" autoFocus {...form.getInputProps("name")} />
            <Select label="Type" data={FIELD_TYPES} {...form.getInputProps("type")} />
            <Checkbox label="Required" {...form.getInputProps("required", { type: "checkbox" })} />

            {fieldType === "string" && <StringFieldConfig form={form} />}
            {fieldType === "markdown" && <MarkdownFieldConfig form={form} />}
            {fieldType === "boolean" && <BooleanFieldConfig form={form} />}
            {fieldType === "select" && <SelectFieldConfig form={form} />}
            {fieldType === "tags" && <TagsFieldConfig form={form} />}
            {fieldType === "user" && <UserFieldConfig form={form} space={space} />}
            {fieldType === "datetime" && <DatetimeFieldConfig form={form} />}
            {fieldType === "int" && <IntFieldConfig form={form} />}
            {fieldType === "float" && <FloatFieldConfig form={form} />}
            {fieldType === "image" && <ImageFieldConfig form={form} />}

            {addFieldMutation.error && <ErrorMessage error={addFieldMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={addFieldMutation.isPending}>
                Add Field
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
