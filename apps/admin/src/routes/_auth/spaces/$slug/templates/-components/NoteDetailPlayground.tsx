import { Suspense, useState, useEffect } from "react"
import { Stack, Group, Text, NumberInput, Loader, Alert } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { PlaygroundLayout } from "./PlaygroundLayout"
import { mantineScope } from "./playgroundScope"

interface NoteDetailPlaygroundProps {
  spaceSlug: string
}

const defaultCode = `<Stack gap="md">
  <Title order={2}>{note.fields.title || "Untitled"}</Title>
  <Text size="sm" c="dimmed">Space: {space.title}</Text>
  <Group>
    {Object.entries(note.fields).map(([key, value]) => (
      <Badge key={key} variant="light">{key}: {String(value)}</Badge>
    ))}
  </Group>
</Stack>`

/** Live React/JSX playground with real note data */
export function NoteDetailPlayground({ spaceSlug }: NoteDetailPlaygroundProps) {
  const [noteNumber, setNoteNumber] = useState<number | null>(null)
  const [loadedNumber, setLoadedNumber] = useState<number | null>(null)

  return (
    <Stack gap="md">
      <Group>
        <Text>Note number</Text>
        <NumberInput
          placeholder="latest"
          value={noteNumber ?? ""}
          onChange={(value) => {
            setNoteNumber(typeof value === "number" ? value : null)
          }}
          min={1}
          style={{ width: 100 }}
        />
        {loadedNumber !== null && <Text c="dimmed">#{loadedNumber}</Text>}
      </Group>
      <Suspense fallback={<Loader />}>
        {noteNumber === null ? (
          <LatestNotePlayground spaceSlug={spaceSlug} onNoteLoaded={setLoadedNumber} />
        ) : (
          <SpecificNotePlayground spaceSlug={spaceSlug} noteNumber={noteNumber} onNoteLoaded={setLoadedNumber} />
        )}
      </Suspense>
    </Stack>
  )
}

interface LatestNotePlaygroundProps {
  spaceSlug: string
  onNoteLoaded: (num: number | null) => void
}

/** Playground that loads the latest note from list */
function LatestNotePlayground({ spaceSlug, onNoteLoaded }: LatestNotePlaygroundProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug))

  useEffect(() => {
    onNoteLoaded(notesList.items[0]?.number ?? null)
  }, [notesList, onNoteLoaded])

  if (notesList.items.length === 0) {
    return <Alert color="yellow">No notes in this space yet</Alert>
  }

  const note = notesList.items[0]
  const scope = { ...mantineScope, space, note }

  return <PlaygroundLayout code={defaultCode} scope={scope} />
}

interface SpecificNotePlaygroundProps {
  spaceSlug: string
  noteNumber: number
  onNoteLoaded: (num: number | null) => void
}

/** Playground that loads a specific note by number */
function SpecificNotePlayground({ spaceSlug, noteNumber, onNoteLoaded }: SpecificNotePlaygroundProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(spaceSlug, noteNumber))

  useEffect(() => {
    onNoteLoaded(note.number)
  }, [note, onNoteLoaded])

  const scope = { ...mantineScope, space, note }

  return <PlaygroundLayout code={defaultCode} scope={scope} />
}
