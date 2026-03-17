import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@/api"
import { LinkButton } from "@/components/LinkButton"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/admin/spaces/-shared/SpaceTabs"
import { FiltersTable } from "./-local/FiltersTable"

export const Route = createFileRoute("/_auth/_admin/admin/spaces/$slug/filters/")({
  component: FiltersPage,
})

/** Space filters list with add filter button */
function FiltersPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/admin/spaces" }, { label: `◈ ${space.slug}` }, { label: "Filters" }]}
        topActions={
          <>
            <SpaceTabs space={space} />
            <LinkButton to="/admin/spaces/$slug/filters/new" params={{ slug }}>
              Add Filter
            </LinkButton>
          </>
        }
      />
      <FiltersTable spaceSlug={slug} filters={space.filters} />
    </Stack>
  )
}
