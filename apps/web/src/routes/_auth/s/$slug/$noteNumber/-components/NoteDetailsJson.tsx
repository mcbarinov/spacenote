import { Code } from "@mantine/core"
import type { Note } from "@spacenote/common/types"

interface NoteDetailsJsonProps {
  note: Note
}

/** Displays note as formatted JSON */
export function NoteDetailsJson({ note }: NoteDetailsJsonProps) {
  return <Code block>{JSON.stringify(note, null, 2)}</Code>
}
