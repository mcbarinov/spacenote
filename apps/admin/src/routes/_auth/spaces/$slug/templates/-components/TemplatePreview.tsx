import { Alert, Paper } from "@mantine/core"
import type { NoteDetailContext, NoteListContext } from "@spacenote/common/templates"
import "@spacenote/common/styles/templates.css"
import { useTemplatePreview } from "./useTemplatePreview"

interface TemplatePreviewProps {
  template: string
  context: NoteDetailContext | NoteListContext
}

/** Renders Liquid template and displays the result */
export function TemplatePreview({ template, context }: TemplatePreviewProps) {
  const { html, error } = useTemplatePreview(template, context)

  if (error) {
    return <Alert color="red">{error}</Alert>
  }

  if (!html) {
    return null
  }

  return (
    <Paper withBorder p="md">
      {/* Safe: output is sanitized by rehype-sanitize in renderTemplate */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Paper>
  )
}
