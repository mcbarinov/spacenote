import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Stack, Title } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { FieldsTable } from "./-components/FieldsTable"

export const Route = createFileRoute("/_auth/spaces/$slug/fields/")({
  component: FieldsPage,
})

function FieldsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={1}>Fields: {space.title}</Title>
        <Link to="/spaces/$slug/fields/new" params={{ slug }}>
          <Button>Add Field</Button>
        </Link>
      </Group>

      <FieldsTable spaceSlug={slug} fields={space.fields} />
    </Stack>
  )
}
