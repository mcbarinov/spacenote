import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Paper, Stack, Text } from "@mantine/core"
import { PageHeader } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
})

/** Admin dashboard with navigation links */
function HomePage() {
  return (
    <Stack gap="md">
      <PageHeader title="Welcome to Spacenote Admin" />

      <Paper withBorder p="md">
        <Stack gap="md">
          <Text>Manage your Spacenote instance from this admin panel.</Text>

          <Group>
            <Button component={Link} to="/users">
              Manage Users
            </Button>
            <Button component={Link} to="/spaces">
              Manage Spaces
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}
