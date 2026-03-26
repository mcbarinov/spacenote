import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Paper, Stack } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/spaces/-shared/SpaceTabs"
import { FilterForm } from "../-shared/FilterForm"

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/filters/$filterName/edit")({
  component: EditFilterPage,
})

/** Form to edit an existing filter */
function EditFilterPage() {
  const { slug, filterName } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const updateFilterMutation = api.mutations.useUpdateFilter(slug, filterName)

  const filter = space.filters.find((f) => f.name === filterName)
  if (!filter) {
    throw new Error(`Filter "${filterName}" not found`)
  }

  const isAllFilter = filterName === "all"

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[
          { label: "Spaces", to: "/" },
          { label: `◈ ${space.slug}` },
          { label: "Filters", to: "/spaces/$slug/filters", params: { slug } },
          { label: `Edit: ${filterName}` },
        ]}
        topActions={<SpaceTabs space={space} />}
      />
      <Paper withBorder p="md">
        <FilterForm
          mode="edit"
          spaceFields={space.fields}
          spaceMembers={space.members.map((m) => m.username)}
          isAllFilter={isAllFilter}
          initialValues={{
            name: filter.name,
            defaultColumns: filter.default_columns.join(", "),
            conditions: filter.conditions.map((c, i) => ({
              id: `condition-${i}`,
              field: c.field,
              operator: c.operator,
              value: c.value,
            })),
            sort: filter.sort,
          }}
          onSubmit={(data) => {
            updateFilterMutation.mutate(data, {
              onSuccess: () => {
                notifications.show({ message: "Filter updated successfully", color: "green" })
                void navigate({ to: "/spaces/$slug/filters", params: { slug } })
              },
            })
          }}
          error={updateFilterMutation.error}
          isPending={updateFilterMutation.isPending}
        />
      </Paper>
    </Stack>
  )
}
