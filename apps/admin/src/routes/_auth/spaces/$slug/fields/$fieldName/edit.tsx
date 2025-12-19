import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { Badge, Button, Checkbox, Group, Paper, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, NewPageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import type { UpdateFieldRequest } from "@spacenote/common/types"
import { StringFieldConfig } from "../-components/StringFieldConfig"
import { BooleanFieldConfig } from "../-components/BooleanFieldConfig"
import { SelectFieldConfig } from "../-components/SelectFieldConfig"
import { TagsFieldConfig } from "../-components/TagsFieldConfig"
import { UserFieldConfig } from "../-components/UserFieldConfig"
import { DatetimeFieldConfig } from "../-components/DatetimeFieldConfig"
import { NumericFieldConfig } from "../-components/NumericFieldConfig"
import { ImageFieldConfig } from "../-components/ImageFieldConfig"
import {
  addFieldSchema,
  buildDefault,
  buildOptions,
  parseFieldToFormValues,
  type FormValues,
} from "../-components/fieldFormUtils"

export const Route = createFileRoute("/_auth/spaces/$slug/fields/$fieldName/edit")({
  component: EditFieldPage,
})

/** Form to edit an existing field */
function EditFieldPage() {
  const { slug, fieldName } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const updateFieldMutation = api.mutations.useUpdateField(slug, fieldName)

  const field = space.fields.find((f) => f.name === fieldName)
  if (!field) {
    throw new Error(`Field "${fieldName}" not found`)
  }

  const form = useForm<FormValues>({
    initialValues: parseFieldToFormValues(field),
    validate: zod4Resolver(addFieldSchema),
  })

  const fieldType = field.type

  const handleSubmit = form.onSubmit((values) => {
    const updateData: UpdateFieldRequest = {
      required: values.required,
      options: buildOptions(values),
      default: buildDefault(values),
    }

    updateFieldMutation.mutate(updateData, {
      onSuccess: () => {
        notifications.show({ message: "Field updated successfully", color: "green" })
        void navigate({ to: "/spaces/$slug/fields", params: { slug } })
      },
    })
  })

  return (
    <Stack gap="md">
      <NewPageHeader
        title="Edit Field"
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: `◈ ${space.slug}` }]}
        topActions={<SpaceTabs space={space} />}
      />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb={4}>
                Name
              </Text>
              <Text>{field.name}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} mb={4}>
                Type
              </Text>
              <Badge variant="light">{field.type}</Badge>
            </div>

            <Checkbox label="Required" {...form.getInputProps("required", { type: "checkbox" })} />

            {fieldType === "string" && <StringFieldConfig form={form} />}
            {fieldType === "boolean" && <BooleanFieldConfig form={form} />}
            {fieldType === "select" && <SelectFieldConfig form={form} />}
            {fieldType === "tags" && <TagsFieldConfig form={form} />}
            {fieldType === "user" && <UserFieldConfig form={form} space={space} />}
            {fieldType === "datetime" && <DatetimeFieldConfig form={form} />}
            {fieldType === "numeric" && <NumericFieldConfig form={form} />}
            {fieldType === "image" && <ImageFieldConfig form={form} />}

            {updateFieldMutation.error && <ErrorMessage error={updateFieldMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={updateFieldMutation.isPending}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}
