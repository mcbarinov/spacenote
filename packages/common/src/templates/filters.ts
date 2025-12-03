import type { Liquid } from "liquidjs"
import { formatDate } from "../utils/format"
import { markdownToHtml } from "./markdown"

/** Registers custom filters on the Liquid engine */
export function registerFilters(engine: Liquid): void {
  // Date/time formatting
  engine.registerFilter("date", (value: string | Date) => {
    if (!value) return ""
    return new Date(value).toLocaleDateString()
  })

  engine.registerFilter("datetime", (value: string | Date) => {
    if (!value) return ""
    return formatDate(value)
  })

  // Markdown rendering (async filter)
  engine.registerFilter("markdown", async (value: string) => {
    if (!value) return ""
    return markdownToHtml(value)
  })

  // JSON formatting
  engine.registerFilter("json", (value: unknown) => {
    return JSON.stringify(value, null, 2)
  })

  // Default value
  engine.registerFilter("default", (value: unknown, defaultValue: string) => {
    return value ?? defaultValue
  })
}
