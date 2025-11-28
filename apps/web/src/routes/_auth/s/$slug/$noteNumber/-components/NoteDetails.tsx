import { Group, Stack, Text } from "@mantine/core"
import type { Note, Space } from "@spacenote/common/types"
import { FieldView } from "@/components/FieldView"

interface NoteDetailsProps {
  note: Note
  space: Space
}

export function NoteDetails({ note, space }: NoteDetailsProps) {
  return (
    <>
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

      <Stack gap="md" mb="xl">
        {space.fields.map((field) => (
          <FieldView
            key={field.name}
            field={field}
            value={note.fields[field.name]}
            noteContext={{ slug: space.slug, noteNumber: note.number }}
          />
        ))}
      </Stack>
    </>
  )
}
