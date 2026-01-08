import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { Button, Checkbox, Group, Paper, Select, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import type { FieldType, SpaceField } from "@spacenote/common/types"
import { StringFieldConfig } from "./-shared/StringFieldConfig"
import { BooleanFieldConfig } from "./-shared/BooleanFieldConfig"
import { SelectFieldConfig } from "./-shared/SelectFieldConfig"
import { TagsFieldConfig } from "./-shared/TagsFieldConfig"
import { UserFieldConfig } from "./-shared/UserFieldConfig"
import { DatetimeFieldConfig } from "./-shared/DatetimeFieldConfig"
import { NumericFieldConfig } from "./-shared/NumericFieldConfig"
import { ImageFieldConfig } from "./-shared/ImageFieldConfig"
import { addFieldSchema, buildDefault, buildOptions, type FormValues } from "./-shared/fieldFormUtils"

export const Route = createFileRoute("/_auth/spaces/$slug/fields/new")({
  component: AddFieldPage,
})

const FIELD_TYPES: FieldType[] = ["string", "boolean", "select", "tags", "user", "datetime", "numeric", "image"]

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
      stringKind: "line",
      minLength: null,
      maxLength: null,
      numericKind: "int",
      datetimeKind: "utc",
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
      defaultDatetime: "",
      defaultNumeric: null,
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
        breadcrumbs={[
          { label: "Spaces", to: "/spaces" },
          { label: `◈ ${space.slug}` },
          { label: "Fields", to: "/spaces/$slug/fields", params: { slug } },
          { label: "Add Field" },
        ]}
        topActions={<SpaceTabs space={space} />}
      />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Name" placeholder="field_name" autoFocus {...form.getInputProps("name")} />
            <Select label="Type" data={FIELD_TYPES} {...form.getInputProps("type")} />
            <Checkbox label="Required" {...form.getInputProps("required", { type: "checkbox" })} />

            {fieldType === "string" && <StringFieldConfig form={form} />}
            {fieldType === "boolean" && <BooleanFieldConfig form={form} />}
            {fieldType === "select" && <SelectFieldConfig form={form} />}
            {fieldType === "tags" && <TagsFieldConfig form={form} />}
            {fieldType === "user" && <UserFieldConfig form={form} space={space} />}
            {fieldType === "datetime" && <DatetimeFieldConfig form={form} />}
            {fieldType === "numeric" && <NumericFieldConfig form={form} />}
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
