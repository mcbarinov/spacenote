import type { Liquid } from "liquidjs"
import type { RecurrenceValue, SelectFieldOptions, SpaceField } from "@/types"
import { formatDate } from "@/utils/format"
import { formatInterval, getRecurrenceStatus, RECURRENCE_STATUS_CONFIG } from "@/utils/recurrence"
import { markdownToHtml } from "./markdown"

/**
 * Registers custom Liquid filters.
 *
 * General:
 *   {{ value | date }}                        — locale date string
 *   {{ value | datetime }}                    — formatted datetime (formatDate)
 *   {{ value | markdown }}                    — markdown → sanitized HTML
 *   {{ value | json }}                        — pretty-printed JSON
 *   {{ value | default: "fallback" }}         — fallback when nil
 *   {{ text  | autolink }}                    — URLs → <a> tags
 *   {{ value | value_map: "field", "color" }} — lookup from field's value_maps (needs space in context)
 *
 * Display:
 *   {{ arr  | tags }}             — ["a","b"] → "#a #b"
 *   {{ name | user }}             — "admin" → "👤admin"
 *
 * Recurrence (input: RecurrenceValue object, e.g. note.fields.repeat):
 *   {{ r | recurrence_status }}   — "Not Started" / "On Track" / "Overdue"
 *   {{ r | recurrence_color }}    — "gray" / "green" / "red"
 *   {{ r | recurrence_interval }} — "Every 2 months"
 *   {{ r | recurrence_due }}      — next_due as locale date
 *   {{ r | recurrence_last }}     — last_completed as locale date (empty if nil)
 */
export function registerFilters(engine: Liquid): void {
  /** {{ value | date }} — locale date string */
  engine.registerFilter("date", (value: string | Date) => {
    if (!value) return ""
    return new Date(value).toLocaleDateString()
  })

  /** {{ value | datetime }} — formatted datetime */
  engine.registerFilter("datetime", (value: string | Date) => {
    if (!value) return ""
    return formatDate(value)
  })

  /** {{ value | markdown }} — markdown → sanitized HTML */
  engine.registerFilter("markdown", async (value: string) => {
    if (!value) return ""
    return markdownToHtml(value)
  })

  /** {{ value | json }} — pretty-printed JSON */
  engine.registerFilter("json", (value: unknown) => JSON.stringify(value, null, 2))

  /** {{ value | default: "fallback" }} — fallback when nil */
  engine.registerFilter("default", (value: unknown, defaultValue: string) => value ?? defaultValue)

  /** {{ text | autolink }} — URLs → clickable <a> tags */
  engine.registerFilter("autolink", (value: string) => {
    if (!value) return ""
    return value.replace(
      /https?:\/\/[^\s<>"']+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    )
  })

  /** {{ arr | tags }} — ["a","b"] → "#a #b" */
  engine.registerFilter("tags", (value: string[] | null) => {
    if (!value || value.length === 0) return ""
    return value.map((t) => `#${t}`).join(" ")
  })

  /** {{ name | user }} — "admin" → "👤admin" */
  engine.registerFilter("user", (value: string) => {
    if (!value) return ""
    return `👤${value}`
  })

  /** {{ r | recurrence_status }} — "Not Started" / "On Track" / "Overdue" */
  engine.registerFilter("recurrence_status", (value: RecurrenceValue | null) => {
    if (!value) return ""
    return RECURRENCE_STATUS_CONFIG[getRecurrenceStatus(value)].label
  })

  /** {{ r | recurrence_color }} — "gray" / "green" / "red" */
  engine.registerFilter("recurrence_color", (value: RecurrenceValue | null) => {
    if (!value) return ""
    return RECURRENCE_STATUS_CONFIG[getRecurrenceStatus(value)].color
  })

  /** {{ r | recurrence_interval }} — e.g. "Every 2 months" */
  engine.registerFilter("recurrence_interval", (value: RecurrenceValue | null) => {
    if (!value) return ""
    return formatInterval(value.interval)
  })

  /** {{ r | recurrence_due }} — next_due as locale date */
  engine.registerFilter("recurrence_due", (value: RecurrenceValue | null) => {
    if (!value) return ""
    return new Date(value.next_due).toLocaleDateString()
  })

  /** {{ r | recurrence_last }} — last_completed as locale date, empty if nil */
  engine.registerFilter("recurrence_last", (value: RecurrenceValue | null) => {
    if (!value?.last_completed) return ""
    return new Date(value.last_completed).toLocaleDateString()
  })

  /** {{ value | value_map: "fieldName", "mapName" }} — lookup from field's value_maps */
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
