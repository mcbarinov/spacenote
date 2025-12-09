import { createFileRoute } from "@tanstack/react-router"
import { Group, Paper, Stack, Text } from "@mantine/core"
import { LinkButton, PageHeader } from "@spacenote/common/components"

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
            <LinkButton to="/users">Manage Users</LinkButton>
            <LinkButton to="/spaces">Manage Spaces</LinkButton>
            <LinkButton to="/telegram/tasks">Telegram</LinkButton>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}
