import { useEffect, useState } from "react"
import { Alert, Paper } from "@mantine/core"
import { renderTemplate, type NoteDetailContext, type NoteListContext } from "@spacenote/common/templates"
import "@spacenote/common/styles/templates.css"

interface TemplatePreviewProps {
  template: string
  context: NoteDetailContext | NoteListContext
}

/** Renders Liquid template and displays the result */
export function TemplatePreview({ template, context }: TemplatePreviewProps) {
  const [html, setHtml] = useState("")
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    void renderTemplate(template, context).then((result) => {
      if (!cancelled) {
        setHtml(result.html)
        setError(result.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [template, context])

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
