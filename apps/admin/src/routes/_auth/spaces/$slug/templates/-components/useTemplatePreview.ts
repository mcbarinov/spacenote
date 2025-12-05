import { useEffect, useState } from "react"
import { renderTemplate, type NoteDetailContext, type NoteListContext } from "@spacenote/common/templates"

/** Hook for rendering Liquid template with cancellation handling */
export function useTemplatePreview(template: string, context: NoteDetailContext | NoteListContext) {
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

  return { html, error }
}
