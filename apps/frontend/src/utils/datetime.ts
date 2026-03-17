import type { DatetimeKind } from "@/types"

/**
 * Convert Date object to UTC ISO string for API.
 *
 * @param date - Date object (in local timezone)
 * @returns ISO string in UTC without milliseconds and Z suffix
 */
export function dateToUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const hours = date.getUTCHours().toString().padStart(2, "0")
  const minutes = date.getUTCMinutes().toString().padStart(2, "0")
  const seconds = date.getUTCSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Convert UTC ISO string from API to local Date object for DateTimePicker.
 *
 * @param utcDatetime - UTC ISO string from backend
 * @returns Date object in local timezone, or null if empty
 */
export function utcToLocalDate(utcDatetime: string): Date | null {
  if (!utcDatetime) return null
  const dateString = utcDatetime.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(utcDatetime) ? utcDatetime : `${utcDatetime}Z`
  return new Date(dateString)
}

/**
 * Compute datetime value from EXIF components based on kind.
 *
 * @param dtOriginal - EXIF DateTimeOriginal (ISO format without timezone)
 * @param offsetOriginal - EXIF OffsetTimeOriginal (e.g., "+03:00") or null
 * @param kind - Datetime field kind
 * @returns Formatted datetime string for the specified kind, or null if invalid
 */
export function computeExifDatetime(
  dtOriginal: string | null | undefined,
  offsetOriginal: string | null | undefined,
  kind: DatetimeKind
): string | null {
  if (!dtOriginal) return null

  switch (kind) {
    case "utc": {
      const date = new Date(`${dtOriginal}Z`)
      if (isNaN(date.getTime())) return null

      if (offsetOriginal) {
        const match = /^([+-])(\d{2}):(\d{2})$/.exec(offsetOriginal)
        if (match) {
          const sign = match[1] === "+" ? 1 : -1
          const hours = parseInt(match[2], 10)
          const minutes = parseInt(match[3], 10)
          const offsetMs = sign * (hours * 3600 + minutes * 60) * 1000
          date.setTime(date.getTime() - offsetMs)
        }
      }
      return dateToUTC(date)
    }
    case "local":
      return dtOriginal.replace("T", " ").slice(0, 19)
    case "date":
      return dtOriginal.slice(0, 10)
  }
}

/**
 * Format Date object for API submission based on datetime kind.
 *
 * @param date - Date object from picker
 * @param kind - Datetime field kind
 * @returns Formatted string for API
 */
export function formatDatetimeForApi(date: Date, kind: DatetimeKind): string {
  const pad = (n: number) => n.toString().padStart(2, "0")

  switch (kind) {
    case "utc":
      return dateToUTC(date)
    case "local": {
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      const seconds = pad(date.getSeconds())
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
    case "date": {
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      return `${year}-${month}-${day}`
    }
  }
}

/**
 * Parse API datetime value to Date object based on kind.
 *
 * @param value - Datetime string from API
 * @param kind - Datetime field kind
 * @returns Date object for picker, or null if empty/invalid
 */
export function parseDatetimeFromApi(value: string | null | undefined, kind: DatetimeKind): Date | null {
  if (!value) return null

  switch (kind) {
    case "utc":
      return utcToLocalDate(value)
    case "local": {
      const normalized = value.replace(" ", "T")
      const date = new Date(normalized)
      return isNaN(date.getTime()) ? null : date
    }
    case "date": {
      const date = new Date(`${value}T00:00:00`)
      return isNaN(date.getTime()) ? null : date
    }
  }
}

/**
 * Get current datetime value based on kind for $now default.
 *
 * @param kind - Datetime field kind
 * @returns Formatted datetime string for the specified kind
 */
export function getCurrentDatetimeForKind(kind: DatetimeKind): string {
  const now = new Date()
  return formatDatetimeForApi(now, kind)
}
