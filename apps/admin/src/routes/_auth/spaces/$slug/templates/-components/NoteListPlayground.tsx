import { Suspense, useState } from "react"
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live"
import { Stack, Group, Title, Text, Badge, Paper, Divider, Select, Loader, Alert } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"

interface NoteListPlaygroundProps {
  spaceSlug: string
  filters: string[]
}

/** Mantine components available in playground scope */
const mantineScope = { Stack, Group, Title, Text, Badge, Paper, Divider }

const defaultCode = `<Stack gap="md">
  <Title order={2}>{space.title} - Notes</Title>
  <Text size="sm" c="dimmed">{notes.length} notes</Text>
  {notes.map((note) => (
    <Paper key={note.number} withBorder p="sm">
      <Group justify="space-between">
        <Text fw={500}>#{note.number}</Text>
        <Badge variant="light">{note.author}</Badge>
      </Group>
    </Paper>
  ))}
</Stack>`

/** Live React/JSX playground with real notes list data */
export function NoteListPlayground({ spaceSlug, filters }: NoteListPlaygroundProps) {
  const [filter, setFilter] = useState<string | null>(filters[0] ?? null)

  if (filters.length === 0) {
    return <Alert color="yellow">No filters defined for this space</Alert>
  }

  return (
    <Stack gap="md">
      <Group>
        <Text>Filter</Text>
        <Select data={filters} value={filter} onChange={setFilter} style={{ width: 150 }} />
      </Group>
      {filter && (
        <Suspense fallback={<Loader />}>
          <PlaygroundContent spaceSlug={spaceSlug} filter={filter} />
        </Suspense>
      )}
    </Stack>
  )
}

interface PlaygroundContentProps {
  spaceSlug: string
  filter: string
}

/** Inner component that loads data and renders playground */
function PlaygroundContent({ spaceSlug, filter }: PlaygroundContentProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug, filter))

  const notes = notesList.items
  const scope = { ...mantineScope, space, notes }

  return (
    <LiveProvider code={defaultCode} scope={scope}>
      <Stack gap="md">
        <Paper withBorder p="md">
          <LiveEditor style={{ fontFamily: "monospace", fontSize: 14 }} />
        </Paper>
        <Divider label="Preview" />
        <Paper withBorder p="md">
          <LiveError />
          <LivePreview />
        </Paper>
      </Stack>
    </LiveProvider>
  )
}
