import { useMemo } from "react"
import type { Note, Space } from "@spacenote/common/types"
import { TemplateRenderer } from "@/components/TemplateRenderer"

interface NoteDetailsTemplateProps {
  note: Note
  space: Space
  template: string
}

/** Renders single note using custom LiquidJS template */
export function NoteDetailsTemplate({ note, space, template }: NoteDetailsTemplateProps) {
  const context = useMemo(() => ({ note, space }), [note, space])
  return <TemplateRenderer template={template} context={context} />
}
