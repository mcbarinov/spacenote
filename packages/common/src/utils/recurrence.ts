import type { RecurrenceValue } from "../types"

export const INTERVAL_UNITS = [
  { value: "h", label: "Hours" },
  { value: "d", label: "Days" },
  { value: "w", label: "Weeks" },
  { value: "m", label: "Months" },
  { value: "y", label: "Years" },
] as const

const UNIT_LABELS: Record<string, { singular: string; plural: string }> = {
  h: { singular: "hour", plural: "hours" },
  d: { singular: "day", plural: "days" },
  w: { singular: "week", plural: "weeks" },
  m: { singular: "month", plural: "months" },
  y: { singular: "year", plural: "years" },
}

const INTERVAL_REGEX = /^(\d+)([hdwmy])$/

/** Parses interval string like "2w" into count and unit */
export function parseInterval(interval: string): { count: number; unit: string } | null {
  const match = INTERVAL_REGEX.exec(interval)
  if (!match) return null
  return { count: Number(match[1]), unit: match[2] }
}

/** Builds interval string from count and unit */
export function buildInterval(count: number, unit: string): string {
  return `${count}${unit}`
}

/** Formats interval for human-readable display */
export function formatInterval(interval: string): string {
  const parsed = parseInterval(interval)
  if (!parsed) return interval
  const labels = UNIT_LABELS[parsed.unit]
  const label = parsed.count === 1 ? labels.singular : labels.plural
  return `Every ${parsed.count} ${label}`
}

export type RecurrenceStatus = "overdue" | "on_track" | "not_started"

export const RECURRENCE_STATUS_CONFIG = {
  overdue: { color: "red", label: "Overdue" },
  on_track: { color: "green", label: "On Track" },
  not_started: { color: "gray", label: "Not Started" },
} as const

/** Derives recurrence status from value */
export function getRecurrenceStatus(value: RecurrenceValue): RecurrenceStatus {
  if (value.last_completed === null) return "not_started"
  if (new Date(value.next_due) < new Date()) return "overdue"
  return "on_track"
}
