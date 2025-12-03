import { Group, Stack, Text } from "@mantine/core"
import type { Note, Space } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"
import { FieldView } from "@/components/FieldView"

interface NoteDetailsDefaultProps {
  note: Note
  space: Space
}

/** Displays note metadata and field values using FieldView components */
export function NoteDetailsDefault({ note, space }: NoteDetailsDefaultProps) {
  return (
    <>
      <Stack gap="xs" mb="lg">
        <Group gap="lg">
          <Text size="sm" c="dimmed">
            Author: {note.author}
          </Text>
          <Text size="sm" c="dimmed">
            Created: {formatDate(note.created_at)}
          </Text>
          {note.edited_at && (
            <Text size="sm" c="dimmed">
              Edited: {formatDate(note.edited_at)}
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
