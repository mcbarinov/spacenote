import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Stack, Title } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { FiltersTable } from "./-components/FiltersTable"

export const Route = createFileRoute("/_auth/spaces/$slug/filters/")({
  component: FiltersPage,
})

function FiltersPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={1}>Filters: {space.title}</Title>
        <Link to="/spaces/$slug/filters/new" params={{ slug }}>
          <Button>Add Filter</Button>
        </Link>
      </Group>

      <FiltersTable spaceSlug={slug} filters={space.filters} />
    </Stack>
  )
}
