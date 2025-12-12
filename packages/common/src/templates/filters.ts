import type { Context, Liquid } from "liquidjs"
import type { SpaceField } from "../types"
import { formatDate } from "../utils/format"
import { markdownToHtml } from "./markdown"

/** Escapes HTML special characters */
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Builds href for adhoc filter link */
function buildAdhocHref(ctx: Context, fieldPath: string, operator: string, value: string): string {
  const env = ctx.environments as { q?: string; filter?: string }
  const currentQ = env.q
  const currentFilter = env.filter

  const condition = `${fieldPath}:${operator}:${encodeURIComponent(value)}`
  const newQ = currentQ ? `${currentQ},${condition}` : condition

  const params = new URLSearchParams()
  if (currentFilter) params.set("filter", currentFilter)
  params.set("q", newQ)

  return `?${params.toString()}`
}

/** Extracts display name from field path (note.fields.status → status, note.author → author) */
function getDisplayName(fieldPath: string): string {
  if (fieldPath.startsWith("note.fields.")) return fieldPath.slice(12)
  if (fieldPath.startsWith("note.")) return fieldPath.slice(5)
  return fieldPath
}

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

  // --- Adhoc filter links ---

  /** Generates clickable link for select field values */
  engine.registerFilter("adhoc_select", function (value: string, fieldPath: string) {
    if (!value) return ""
    const href = buildAdhocHref(this.context, fieldPath, "eq", value)
    const escaped = escapeHtml(value)
    const displayName = getDisplayName(fieldPath)
    return `<a href="${href}" title="Filter: ${displayName} = ${escaped}" class="AdhocBadge">${escaped}</a>`
  })

  /** Generates clickable link for user field values (works for both note.author and note.fields.*) */
  engine.registerFilter("adhoc_user", function (value: string, fieldPath: string) {
    if (!value) return ""
    const href = buildAdhocHref(this.context, fieldPath, "eq", value)
    const escaped = escapeHtml(value)
    const displayName = getDisplayName(fieldPath)
    return `<a href="${href}" title="Filter: ${displayName} = ${escaped}" class="AdhocUser">👤${escaped}</a>`
  })

  /** Generates clickable link for a single tag */
  engine.registerFilter("adhoc_tag", function (value: string, fieldPath: string) {
    if (!value) return ""
    const href = buildAdhocHref(this.context, fieldPath, "in", value)
    const escaped = escapeHtml(value)
    const displayName = getDisplayName(fieldPath)
    return `<a href="${href}" title="Filter: ${displayName} ~ ${escaped}" class="AdhocTag">#${escaped}</a>`
  })

  /** Gets value from field's value_maps (e.g., color, icon) */
  engine.registerFilter("value_map", function (value: string, fieldName: string, mapName: string) {
    if (!value || !fieldName || !mapName) return ""

    const env = this.context.environments as { space?: { fields?: SpaceField[] } }
    const space = env.space

    if (!space?.fields) return ""

    const field = space.fields.find((f) => f.name === fieldName)
    const valueMaps = field?.options.value_maps as Record<string, Record<string, string>> | undefined
    const mapValue = valueMaps?.[mapName]?.[value]

    return typeof mapValue === "string" ? mapValue : ""
  })
}
