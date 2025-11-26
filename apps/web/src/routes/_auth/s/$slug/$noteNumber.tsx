import { createFileRoute } from "@tanstack/react-router"
import { Group, Stack, Text, Title } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton } from "@spacenote/common/components"
import { FieldView } from "@/components/FieldView"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(api.queries.getNote(params.slug, Number(params.noteNumber)))
  },
  component: NoteDetailPage,
})

function NoteDetailPage() {
  const { slug, noteNumber } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, Number(noteNumber)))

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={1}>Note #{note.number}</Title>
        <LinkButton to="/s/$slug" params={{ slug }} variant="subtle">
          Back
        </LinkButton>
      </Group>

      <Stack gap="xs" mb="lg">
        <Group gap="lg">
          <Text size="sm" c="dimmed">
            Author: {note.author}
          </Text>
          <Text size="sm" c="dimmed">
            Created: {new Date(note.created_at).toLocaleString()}
          </Text>
          {note.edited_at && (
            <Text size="sm" c="dimmed">
              Edited: {new Date(note.edited_at).toLocaleString()}
            </Text>
          )}
        </Group>
      </Stack>

      <Stack gap="md">
        {space.fields.map((field) => (
          <FieldView key={field.name} field={field} value={note.fields[field.name]} />
        ))}
      </Stack>
    </>
  )
}
