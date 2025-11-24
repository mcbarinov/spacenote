import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core"

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
})

function HomePage() {
  return (
    <Stack gap="md">
      <Title order={1}>Welcome to Spacenote Admin</Title>

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
