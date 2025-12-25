import type { Liquid } from "liquidjs"
import type { SelectFieldOptions, SpaceField } from "../types"
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

  // Auto-link URLs in text
  engine.registerFilter("autolink", (value: string) => {
    if (!value) return ""
    return value.replace(
      /https?:\/\/[^\s<>"']+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    )
  })

  /** Gets value from field's value_maps (e.g., color, icon) */
  engine.registerFilter("value_map", function (value: string, fieldName: string, mapName: string) {
    if (!value || !fieldName || !mapName) return ""

    const env = this.context.environments as { space?: { fields?: SpaceField[] } }
    const space = env.space

    if (!space?.fields) return ""

    const field = space.fields.find((f) => f.name === fieldName)
    if (field?.type !== "select") return ""
    const opts = field.options as SelectFieldOptions
    const valueMaps = opts.value_maps
    const mapValue = valueMaps?.[mapName]?.[value]

    return typeof mapValue === "string" ? mapValue : ""
  })
}
