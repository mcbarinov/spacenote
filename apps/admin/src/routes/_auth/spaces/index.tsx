import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Stack, Title } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { SpacesTable } from "./-components/SpacesTable"

export const Route = createFileRoute("/_auth/spaces/")({
  component: SpacesPage,
})

function SpacesPage() {
  const spaces = api.cache.useSpaces()

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={1}>Spaces</Title>
        <Button component={Link} to="/spaces/new">
          Create Space
        </Button>
      </Group>

      <SpacesTable spaces={spaces} />
    </Stack>
  )
}
