import { useEffect, useState } from "react"
import { Typography } from "@mantine/core"
import { remark } from "remark"
import remarkGfm from "remark-gfm"
import remarkHtml from "remark-html"
import rehypeSanitize from "rehype-sanitize"
import { rehype } from "rehype"

const processor = remark().use(remarkGfm).use(remarkHtml, { sanitize: false })
const sanitizer = rehype().use(rehypeSanitize)

async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown) return ""
  const html = await processor.process(markdown)
  const sanitized = await sanitizer.process(String(html))
  return String(sanitized)
}

interface MarkdownDisplayProps {
  content: string
}

export function MarkdownDisplay({ content }: MarkdownDisplayProps) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    // Prevent stale updates when content changes faster than async processing
    let cancelled = false
    void markdownToHtml(content).then((result) => {
      if (!cancelled) setHtml(result)
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
