import { useEffect, useState } from "react"
import { Typography } from "@mantine/core"
import { markdownToHtml } from "@spacenote/common/templates"

interface MarkdownDisplayProps {
  content: string
}

/** Renders markdown content as sanitized HTML */
export function MarkdownDisplay({ content }: MarkdownDisplayProps) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    let cancelled = false
    void markdownToHtml(content)
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console -- Log rendering errors for debugging
        console.error("Failed to render markdown:", error)
        if (!cancelled) setHtml(content)
      })
    return () => {
      cancelled = true
    }
  }, [content])

  // Return empty element to prevent layout shift during async processing
  if (!html) return <Typography />

  // dangerouslySetInnerHTML is safe here because we sanitize the HTML with rehype-sanitize
  // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
  return <Typography dangerouslySetInnerHTML={{ __html: html }} />
}
