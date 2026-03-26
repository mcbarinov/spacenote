import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Paper, Stack } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/spaces/-shared/SpaceTabs"
import type { UpdateFieldRequest } from "@/types"
import { buildDefault, buildOptions, parseFieldToFormValues, type FormValues } from "../-shared/fieldFormUtils"
import { FieldForm } from "../-shared/FieldForm"

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/fields/$fieldName/edit")({
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

  function handleSubmit(values: FormValues) {
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
  }

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[
          { label: "Spaces", to: "/" },
          { label: `◈ ${space.slug}` },
          { label: "Fields", to: "/spaces/$slug/fields", params: { slug } },
          { label: "Edit Field" },
        ]}
        topActions={<SpaceTabs space={space} />}
      />
      <Paper withBorder p="md">
        <FieldForm
          mode="edit"
          space={space}
          initialValues={parseFieldToFormValues(field)}
          fixedFieldType={field.type}
          onSubmit={handleSubmit}
          error={updateFieldMutation.error}
          isPending={updateFieldMutation.isPending}
        />
      </Paper>
    </Stack>
  )
}
