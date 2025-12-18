import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { renderTemplate, type NoteDetailContext, type NoteListContext } from "@spacenote/common/templates"
import "@spacenote/common/styles/templates.css"

interface TemplateRendererProps {
  template: string
  context: NoteDetailContext | NoteListContext
}

/** Renders LiquidJS template HTML and intercepts local link clicks for client-side navigation. */
export function TemplateRenderer({ template, context }: TemplateRendererProps) {
  const [html, setHtml] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    void renderTemplate(template, context).then(({ html }) => {
      if (!cancelled) setHtml(html)
    })
    return () => {
      cancelled = true
    }
  }, [template, context])

  /** Intercepts clicks on local links and uses client-side navigation */
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    const anchor = target.closest("a")
    if (!anchor) return

    const href = anchor.getAttribute("href")
    if (!href) return

    if (href.startsWith("/") || href.startsWith("?")) {
      e.preventDefault()
      void navigate({ to: href })
    }
  }

  if (!html) return null

  // dangerouslySetInnerHTML is safe: template output is sanitized by rehype-sanitize
  // onClick delegates to anchor elements inside, which handle their own keyboard interactions
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react-dom/no-dangerously-set-innerhtml
    <div onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
  )
}
