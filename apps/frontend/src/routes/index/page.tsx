import { createFileRoute } from "@tanstack/react-router"
import { SimpleGrid, Text } from "@mantine/core"
import { api } from "@/api"
import SpaceCard from "./-local/SpaceCard"

export const Route = createFileRoute("/_auth/")({
  component: SpacesGrid,
})

/** Grid of spaces the current user has access to */
function SpacesGrid() {
  const spaces = api.cache.useSpaces()

  return spaces.length === 0 ? (
    <Text c="dimmed">You don't have access to any spaces yet.</Text>
  ) : (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {spaces.map((space) => (
        <SpaceCard key={space.slug} space={space} />
      ))}
    </SimpleGrid>
  )
}
