import { Code } from "@mantine/core"
import type { Note } from "@spacenote/common/types"

interface NotesListJsonProps {
  notes: Note[]
}

/** Displays notes list as formatted JSON */
export function NotesListJson({ notes }: NotesListJsonProps) {
  return <Code block>{JSON.stringify(notes, null, 2)}</Code>
}
