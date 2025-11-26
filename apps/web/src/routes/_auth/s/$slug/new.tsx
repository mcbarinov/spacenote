import { createFileRoute } from "@tanstack/react-router"
import { Paper, Text, Title } from "@mantine/core"

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

function NewNotePage() {
  return (
    <>
      <Title order={1} mb="md">
        New Note
      </Title>
      <Paper withBorder p="xl">
        <Text c="dimmed" ta="center">
          Note creation coming soon...
        </Text>
      </Paper>
    </>
  )
}
