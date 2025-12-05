import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { Button, Checkbox, Group, NumberInput, Paper, Select, Stack, TagsInput, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import type { FieldType, SpaceField } from "@spacenote/common/types"

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
  selectValues: z.array(z.string()), // for "select" type
  minValue: z.number().nullable(), // for "int", "float" types
  maxValue: z.number().nullable(), // for "int", "float" types
  maxWidth: z.number().nullable(), // for "image" type
})

type FormValues = z.infer<typeof addFieldSchema>

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
      selectValues: [], // for "select" type
      minValue: null, // for "int", "float" types
      maxValue: null, // for "int", "float" types
      maxWidth: null, // for "image" type
    },
    validate: zod4Resolver(addFieldSchema),
  })

  const fieldType = form.values.type as FieldType
  const showSelectValues = fieldType === "select"
  const showMinMax = fieldType === "int" || fieldType === "float"
  const showMaxWidth = fieldType === "image"

  const handleSubmit = form.onSubmit((values) => {
    let options: SpaceField["options"] = {}

    if (showSelectValues && values.selectValues.length > 0) {
      options = { values: values.selectValues }
    } else if (showMinMax) {
      const numOptions: Record<string, number> = {}
      if (values.minValue !== null) numOptions.min = values.minValue
      if (values.maxValue !== null) numOptions.max = values.maxValue
      if (Object.keys(numOptions).length > 0) {
        options = numOptions
      }
    } else if (showMaxWidth && values.maxWidth !== null) {
      options = { max_width: values.maxWidth }
    }

    const field: SpaceField = {
      name: values.name,
      type: values.type as FieldType,
      required: values.required,
      options,
      default: null,
    }

    addFieldMutation.mutate(field, {
      onSuccess: () => {
        notifications.show({
          message: "Field added successfully",
          color: "green",
        })
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

            {showSelectValues && (
              <TagsInput label="Values" placeholder="Enter values and press Enter" {...form.getInputProps("selectValues")} />
            )}

            {showMinMax && (
              <Group grow>
                <NumberInput label="Min" placeholder="Optional" {...form.getInputProps("minValue")} />
                <NumberInput label="Max" placeholder="Optional" {...form.getInputProps("maxValue")} />
              </Group>
            )}

            {showMaxWidth && (
              <NumberInput label="Max Width (px)" placeholder="Optional, e.g. 800" {...form.getInputProps("maxWidth")} />
            )}

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
