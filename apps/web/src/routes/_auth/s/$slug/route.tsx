import { createFileRoute } from "@tanstack/react-router"
import { Title, Text, Paper } from "@mantine/core"
import { api } from "@spacenote/common/api"

export const Route = createFileRoute("/_auth/s/$slug")({
  component: SpacePage,
})

function SpacePage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <>
      <Title order={1} mb="md">
        {space.title}
      </Title>
      {space.description && (
        <Text c="dimmed" mb="lg">
          {space.description}
        </Text>
      )}
      <Paper withBorder p="xl">
        <Text c="dimmed" ta="center">
          Space content coming soon...
        </Text>
      </Paper>
    </>
  )
}
