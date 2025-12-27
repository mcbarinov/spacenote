import { useMemo } from "react"
import type { Note, Space } from "@spacenote/common/types"
import { TemplateRenderer } from "@/components/TemplateRenderer"

interface NotesListTemplateProps {
  notes: Note[]
  space: Space
  template: string
  q?: string
  filter?: string
}

/** Renders notes list using custom LiquidJS template */
export function NotesListTemplate({ notes, space, template, q, filter }: NotesListTemplateProps) {
  const context = useMemo(() => ({ notes, space, q, filter }), [notes, space, q, filter])
  return <TemplateRenderer template={template} context={context} />
}
