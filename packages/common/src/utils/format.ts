import type { DatetimeKind } from "./datetime"

/** Formats date to YYYY-MM-DD HH:MM */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, "0")
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Format datetime value for display based on kind.
 *
 * @param value - Datetime string from API
 * @param kind - Datetime field kind
 * @returns Formatted string for display
 */
export function formatDatetime(value: string, kind: DatetimeKind): string {
  if (!value) return ""

  const pad = (n: number) => n.toString().padStart(2, "0")

  switch (kind) {
    case "utc": {
      // Parse as UTC, display in local timezone
      const dateString = value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`
      const d = new Date(dateString)
      if (isNaN(d.getTime())) return value
      const year = d.getFullYear()
      const month = pad(d.getMonth() + 1)
      const day = pad(d.getDate())
      const hours = pad(d.getHours())
      const minutes = pad(d.getMinutes())
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
    case "local": {
      // Display as-is (naive datetime), just reformat
      const normalized = value.replace("T", " ")
      // Show YYYY-MM-DD HH:MM (drop seconds if present)
      return normalized.slice(0, 16).replace("T", " ")
    }
    case "date":
      // Show date only
      return value.slice(0, 10)
  }
}

/** Formats bytes to human-readable size (B, KB, MB) */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
