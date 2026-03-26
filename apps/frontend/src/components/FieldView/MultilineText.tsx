import { Anchor } from "@mantine/core"
import type { ReactNode } from "react"

interface MultilineTextProps {
  children: string
}

const URL_REGEX = /https?:\/\/[^\s<>"']+/g

/** Parses text and converts URLs to clickable links */
function parseTextWithLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const url = match[0]
    parts.push(
      <Anchor key={match.index} href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </Anchor>
    )

    lastIndex = match.index + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

/** Displays multiline text with preserved line breaks and auto-linked URLs */
export function MultilineText({ children }: MultilineTextProps) {
  return <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{parseTextWithLinks(children)}</span>
}
