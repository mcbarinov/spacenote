import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { LinkButton, PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import { FiltersTable } from "./-components/FiltersTable"

export const Route = createFileRoute("/_auth.layout/spaces/$slug/filters/")({
  component: FiltersPage,
})

/** Space filters list with add filter button */
function FiltersPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        title="Filters"
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: `◈ ${space.slug}` }]}
        topActions={<SpaceTabs space={space} />}
        bottomActions={
          <LinkButton to="/spaces/$slug/filters/new" params={{ slug }} variant="light">
            Add Filter
          </LinkButton>
        }
      />
      <FiltersTable spaceSlug={slug} filters={space.filters} />
    </Stack>
  )
}
