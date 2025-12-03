import { useEffect, useState } from "react"
import type { Note, Space } from "@spacenote/common/types"
import { renderTemplate } from "@spacenote/common/templates"
import "@spacenote/common/styles/templates.css"

interface NoteDetailsTemplateProps {
  note: Note
  space: Space
  template: string
}

/** Renders note using custom LiquidJS template */
export function NoteDetailsTemplate({ note, space, template }: NoteDetailsTemplateProps) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    let cancelled = false
    void renderTemplate(template, { note, space }).then(({ html }) => {
      if (!cancelled) setHtml(html)
    })
    return () => {
      cancelled = true
    }
  }, [note, space, template])

  if (!html) return null

  // dangerouslySetInnerHTML is safe: template output is sanitized by rehype-sanitize
  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
