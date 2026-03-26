import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Paper, Stack } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/spaces/-shared/SpaceTabs"
import { FilterForm } from "./-shared/FilterForm"

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/filters/new")({
  component: AddFilterPage,
})

/** Form to add a new filter to a space */
function AddFilterPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const addFilterMutation = api.mutations.useAddFilter(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[
          { label: "Spaces", to: "/" },
          { label: `◈ ${space.slug}` },
          { label: "Filters", to: "/spaces/$slug/filters", params: { slug } },
          { label: "Add Filter" },
        ]}
        topActions={<SpaceTabs space={space} />}
      />
      <Paper withBorder p="md">
        <FilterForm
          mode="create"
          spaceFields={space.fields}
          spaceMembers={space.members.map((m) => m.username)}
          initialValues={{ name: "", defaultColumns: "", conditions: [], sort: [] }}
          onSubmit={(data) => {
            addFilterMutation.mutate(data, {
              onSuccess: () => {
                notifications.show({ message: "Filter added successfully", color: "green" })
                void navigate({ to: "/spaces/$slug/filters", params: { slug } })
              },
            })
          }}
          error={addFilterMutation.error}
          isPending={addFilterMutation.isPending}
        />
      </Paper>
    </Stack>
  )
}
