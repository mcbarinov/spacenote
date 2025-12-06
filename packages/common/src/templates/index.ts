import { Liquid } from "liquidjs"
import type { Note, Space } from "../types"
import { registerFilters } from "./filters"

export { markdownToHtml } from "./markdown"

const engine = new Liquid({
  strictFilters: false,
  strictVariables: false,
  lenientIf: true,
  jsTruthy: true,
})

registerFilters(engine)

/** Context for note detail template */
export interface NoteDetailContext {
  note: Note
  space: Space
}

/** Context for note list template */
export interface NoteListContext {
  notes: Note[]
  space: Space
  q?: string
  filter?: string
}

/** Renders a template with the given context */
export async function renderTemplate(
  template: string,
  context: NoteDetailContext | NoteListContext
): Promise<{ html: string; error?: string }> {
  try {
    const html = String(await engine.parseAndRender(template, context))
    return { html }
  } catch (error) {
    return {
      html: "",
      error: error instanceof Error ? error.message : "Template rendering failed",
    }
  }
}

/** Validates template syntax without rendering */
export function isValidTemplate(template: string): boolean {
  try {
    engine.parse(template)
    return true
  } catch {
    return false
  }
}
