import { useEffect, useState } from "react"
import type { Note, Space } from "@spacenote/common/types"
import { renderTemplate } from "@spacenote/common/templates"
import "@spacenote/common/styles/templates.css"

interface NotesListTemplateProps {
  notes: Note[]
  space: Space
  template: string
}

/** Renders notes list using custom LiquidJS template */
export function NotesListTemplate({ notes, space, template }: NotesListTemplateProps) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    let cancelled = false
    void renderTemplate(template, { notes, space }).then(({ html }) => {
      if (!cancelled) setHtml(html)
    })
    return () => {
      cancelled = true
    }
  }, [notes, space, template])

  if (!html) return null

  // dangerouslySetInnerHTML is safe: template output is sanitized by rehype-sanitize
  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
