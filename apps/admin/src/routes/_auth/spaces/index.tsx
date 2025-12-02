import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { SpaceHeader } from "@/components/SpaceHeader"
import { SpacesTable } from "./-components/SpacesTable"

export const Route = createFileRoute("/_auth/spaces/")({
  component: SpacesPage,
})

/** Spaces list page with create space button */
function SpacesPage() {
  const spaces = api.cache.useSpaces()

  return (
    <Stack gap="md">
      <SpaceHeader title="Spaces" nav={[{ label: "Create Space", to: "/spaces/new" }]} />
      <SpacesTable spaces={spaces} />
    </Stack>
  )
}
