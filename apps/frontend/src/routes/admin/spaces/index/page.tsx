import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Stack } from "@mantine/core"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { SpacesTable } from "./-local/SpacesTable"

export const Route = createFileRoute("/_auth/_admin/admin/spaces/")({
  component: SpacesPage,
})

/** Spaces list page with create space button */
function SpacesPage() {
  const spaces = api.cache.useSpaces()

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces" }]}
        topActions={
          <Button component={Link} to="/admin/spaces/new">
            Create Space
          </Button>
        }
      />
      <SpacesTable spaces={spaces} />
    </Stack>
  )
}
