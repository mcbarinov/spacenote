import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { SpaceHeader } from "@/components/SpaceHeader"
import { FiltersTable } from "./-components/FiltersTable"

export const Route = createFileRoute("/_auth/spaces/$slug/filters/")({
  component: FiltersPage,
})

/** Space filters list with add filter button */
function FiltersPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <SpaceHeader
        space={space}
        title="Filters"
        nav={[{ label: "Add Filter", to: "/spaces/$slug/filters/new", params: { slug } }]}
      />
      <FiltersTable spaceSlug={slug} filters={space.filters} />
    </Stack>
  )
}
