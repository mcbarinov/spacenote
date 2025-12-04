import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live"
import { Stack, Group, Title, Text, Badge, Paper, Divider } from "@mantine/core"

/** Mantine components available in the playground scope */
const scope = {
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Paper,
  Divider,
  // Mock note data for testing
  note: {
    title: "Example Note",
    created_at: "2024-01-15",
    fields: { status: "active", description: "Some text here" },
  },
}

const defaultCode = `<Stack gap="md">
  <Title order={2}>{note.title}</Title>
  <Badge color="blue">{note.fields.status}</Badge>
  <Text>{note.fields.description}</Text>
</Stack>`

/** Live React/JSX playground with Mantine components */
export function TemplatePlayground() {
  return (
    <LiveProvider code={defaultCode} scope={scope}>
      <Group align="flex-start" gap="md" grow>
        <Paper withBorder p="md">
          <LiveEditor style={{ fontFamily: "monospace", fontSize: 14 }} />
        </Paper>
        <Paper withBorder p="md">
          <LiveError />
          <Divider my="sm" />
          <LivePreview />
        </Paper>
      </Group>
    </LiveProvider>
  )
}
