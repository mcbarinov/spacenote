import { remark } from "remark"
import remarkGfm from "remark-gfm"
import remarkHtml from "remark-html"
import rehypeSanitize from "rehype-sanitize"
import { rehype } from "rehype"

const processor = remark().use(remarkGfm).use(remarkHtml, { sanitize: false })
const sanitizer = rehype().use(rehypeSanitize)

/** Converts markdown to sanitized HTML */
export async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown) return ""
  const html = await processor.process(markdown)
  const sanitized = await sanitizer.process(String(html))
  return String(sanitized)
}
