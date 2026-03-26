import { type ReactNode, Suspense, useEffect, useState } from "react"
import { Alert, Group, Loader, NumberInput, Text } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@/api"
import type { Note, Space } from "@/types"

interface NotePickerPreviewProps {
  spaceSlug: string
  /** Render callback receiving the loaded note and space */
  children: (note: Note, space: Space) => ReactNode
  /** Render when space has no notes */
  emptyMessage?: string
}

/**
 * Shared note picker with number input and Suspense boundary.
 * Loads the latest note by default, or a specific note by number.
 */
export function NotePickerPreview({ spaceSlug, children, emptyMessage = "No notes in this space yet" }: NotePickerPreviewProps) {
  const [noteNumber, setNoteNumber] = useState<number | null>(null)
  const [loadedNumber, setLoadedNumber] = useState<number | null>(null)

  return (
    <>
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
          <LatestNoteLoader spaceSlug={spaceSlug} onNoteLoaded={setLoadedNumber} emptyMessage={emptyMessage}>
            {children}
          </LatestNoteLoader>
        ) : (
          <SpecificNoteLoader spaceSlug={spaceSlug} noteNumber={noteNumber} onNoteLoaded={setLoadedNumber}>
            {children}
          </SpecificNoteLoader>
        )}
      </Suspense>
    </>
  )
}

interface LatestNoteLoaderProps {
  spaceSlug: string
  onNoteLoaded: (num: number | null) => void
  emptyMessage: string
  children: (note: Note, space: Space) => ReactNode
}

/** Loads the latest note from the space */
function LatestNoteLoader({ spaceSlug, onNoteLoaded, emptyMessage, children }: LatestNoteLoaderProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug))

  useEffect(() => {
    onNoteLoaded(notesList.items[0]?.number ?? null)
  }, [notesList, onNoteLoaded])

  if (notesList.items.length === 0) {
    return <Alert color="yellow">{emptyMessage}</Alert>
  }

  return <>{children(notesList.items[0], space)}</>
}

interface SpecificNoteLoaderProps {
  spaceSlug: string
  noteNumber: number
  onNoteLoaded: (num: number | null) => void
  children: (note: Note, space: Space) => ReactNode
}

/** Loads a specific note by number */
function SpecificNoteLoader({ spaceSlug, noteNumber, onNoteLoaded, children }: SpecificNoteLoaderProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(spaceSlug, noteNumber))

  useEffect(() => {
    onNoteLoaded(note.number)
  }, [note, onNoteLoaded])

  return <>{children(note, space)}</>
}
