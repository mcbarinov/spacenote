import { Link, createFileRoute } from "@tanstack/react-router"
import { Button, Group, Paper, Stack, Table, Title } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { LinkButton, SpaceSlug } from "@spacenote/common/components"
import { SpaceMenu } from "@/components/SpaceMenu"
import { UsersBlock } from "./-components/users/UsersBlock"

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
})

/** Admin dashboard with sections for users, spaces, and telegram */
function HomePage() {
  return (
    <Stack gap="xl">
      <Title order={2}>Admin Dashboard</Title>
      <UsersBlock />
      <SpacesBlock />
      <TelegramBlock />
    </Stack>
  )
}

/** Spaces section with list and create button */
function SpacesBlock() {
  const spaces = api.cache.useSpaces()

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>Spaces</Title>
          <Button component={Link} to="/spaces/new" size="xs">
            Create Space
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {spaces.map((space) => (
              <Table.Tr key={space.slug}>
                <Table.Td>{space.title}</Table.Td>
                <Table.Td>
                  <SpaceSlug slug={space.slug} />
                </Table.Td>
                <Table.Td>
                  <SpaceMenu space={space} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Paper>
  )
}

/** Telegram section with links to tasks and mirrors */
function TelegramBlock() {
  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Title order={3}>Telegram</Title>
        <Group>
          <LinkButton to="/telegram/tasks">Tasks</LinkButton>
          <LinkButton to="/telegram/mirrors">Mirrors</LinkButton>
        </Group>
      </Stack>
    </Paper>
  )
}
