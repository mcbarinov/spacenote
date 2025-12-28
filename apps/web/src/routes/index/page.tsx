import { createFileRoute } from "@tanstack/react-router"
import { SimpleGrid, Text } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import SpaceCard from "./-local/SpaceCard"

export const Route = createFileRoute("/_auth.layout/")({
  component: HomePage,
})

/** Home page showing user's spaces grid */
function HomePage() {
  const spaces = api.cache.useSpaces()

  return (
    <>
      <PageHeader />

      {spaces.length === 0 ? (
        <Text c="dimmed">You don't have access to any spaces yet.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {spaces.map((space) => (
            <SpaceCard key={space.slug} space={space} />
          ))}
        </SimpleGrid>
      )}
    </>
  )
}
