import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Paper, Stack } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/spaces/-shared/SpaceTabs"
import type { FieldType, SpaceField } from "@/types"
import { DEFAULT_FORM_VALUES, buildDefault, buildOptions, type FormValues } from "./-shared/fieldFormUtils"
import { FieldForm } from "./-shared/FieldForm"

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/fields/new")({
  component: AddFieldPage,
})

/** Form to add a new field to a space */
function AddFieldPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const addFieldMutation = api.mutations.useAddField(slug)

  function handleSubmit(values: FormValues) {
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
  }

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[
          { label: "Spaces", to: "/" },
          { label: `◈ ${space.slug}` },
          { label: "Fields", to: "/spaces/$slug/fields", params: { slug } },
          { label: "Add Field" },
        ]}
        topActions={<SpaceTabs space={space} />}
      />
      <Paper withBorder p="md">
        <FieldForm
          mode="create"
          space={space}
          initialValues={DEFAULT_FORM_VALUES}
          onSubmit={handleSubmit}
          error={addFieldMutation.error}
          isPending={addFieldMutation.isPending}
        />
      </Paper>
    </Stack>
  )
}
