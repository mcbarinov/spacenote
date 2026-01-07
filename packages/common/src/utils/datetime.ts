/**
 * Convert local datetime to UTC ISO string for API.
 *
 * DateTimePicker returns Date objects in local timezone.
 * The backend expects ISO strings in UTC.
 *
 * @param localDatetime - Value from DateTimePicker or local datetime string (e.g., "2025-10-20T13:00")
 * @returns ISO string in UTC without timezone suffix (e.g., "2025-10-20T13:00:00")
 *
 * @example
 * // User in Atlantic/Reykjavik (UTC+0) selects 1 PM
 * localDatetimeToUTC("2025-10-20T13:00") // Returns "2025-10-20T13:00:00"
 */
export function localDatetimeToUTC(localDatetime: string): string {
  if (!localDatetime) return ""

  const localDate = new Date(localDatetime)

  const year = localDate.getUTCFullYear()
  const month = (localDate.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = localDate.getUTCDate().toString().padStart(2, "0")
  const hours = localDate.getUTCHours().toString().padStart(2, "0")
  const minutes = localDate.getUTCMinutes().toString().padStart(2, "0")
  const seconds = localDate.getUTCSeconds().toString().padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Convert Date object to UTC ISO string for API.
 *
 * @param date - Date object (in local timezone)
 * @returns ISO string in UTC without milliseconds and Z suffix (e.g., "2025-10-20T10:00:00")
 *
 * @example
 * // User in Atlantic/Reykjavik (UTC+0) at 1 PM local
 * dateToUTC(new Date()) // Returns "2025-10-20T13:00:00"
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
 * The backend returns UTC ISO strings like "2025-10-20T10:00:00Z".
 * DateTimePicker expects Date objects in local timezone.
 *
 * @param utcDatetime - UTC ISO string from backend (e.g., "2025-10-20T10:00:00Z")
 * @returns Date object in local timezone, or null if empty
 *
 * @example
 * // Backend returns 1 PM UTC, user in Atlantic/Reykjavik (UTC+0) sees 1 PM
 * utcToLocalDate("2025-10-20T13:00:00Z") // Returns Date representing 1 PM local
 */
export function utcToLocalDate(utcDatetime: string): Date | null {
  if (!utcDatetime) return null

  // Ensure the string is treated as UTC
  const dateString = utcDatetime.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(utcDatetime) ? utcDatetime : `${utcDatetime}Z`
  return new Date(dateString)
}

/**
 * Get the user's timezone name for display purposes.
 *
 * @returns Timezone name (e.g., "Atlantic/Reykjavik", "Europe/London", "Asia/Tokyo")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Get the user's timezone offset in hours for display purposes.
 *
 * @returns Offset string (e.g., "UTC+0", "UTC-5", "UTC+3")
 */
export function getUserTimezoneOffset(): string {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const offsetHours = offsetMinutes / 60
  const sign = offsetHours >= 0 ? "+" : ""
  return `UTC${sign}${offsetHours}`
}

export type DatetimeKind = "utc" | "local" | "date"

/**
 * Compute datetime value from EXIF components based on kind.
 *
 * @param dtOriginal - EXIF DateTimeOriginal (ISO format without timezone: "2025-01-15T10:30:00")
 * @param offsetOriginal - EXIF OffsetTimeOriginal (e.g., "+03:00", "-05:00") or null
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
      // Parse as UTC first, then apply offset to convert to actual UTC
      const date = new Date(`${dtOriginal}Z`)
      if (isNaN(date.getTime())) return null

      if (offsetOriginal) {
        // dtOriginal is local time, apply offset to get UTC
        // Offset format: "+HH:MM" or "-HH:MM"
        const match = /^([+-])(\d{2}):(\d{2})$/.exec(offsetOriginal)
        if (match) {
          const sign = match[1] === "+" ? 1 : -1
          const hours = parseInt(match[2], 10)
          const minutes = parseInt(match[3], 10)
          const offsetMs = sign * (hours * 3600 + minutes * 60) * 1000
          // Subtract offset: if photo was taken at +03:00, subtract 3 hours to get UTC
          date.setTime(date.getTime() - offsetMs)
        }
      }
      return dateToUTC(date)
    }
    case "local":
      // Return as-is (naive datetime) - just ensure proper format
      return dtOriginal.replace("T", " ").slice(0, 19)
    case "date":
      // Extract date part only
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
      // Convert to UTC
      return dateToUTC(date)
    case "local": {
      // Use local time components (no timezone conversion)
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      const seconds = pad(date.getSeconds())
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
    case "date": {
      // Date only, use local date
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
      // Parse as UTC, returns Date in local timezone
      return utcToLocalDate(value)
    case "local": {
      // Parse as local time (naive datetime)
      // Replace space with T for Date parsing, treat as local
      const normalized = value.replace(" ", "T")
      const date = new Date(normalized)
      return isNaN(date.getTime()) ? null : date
    }
    case "date": {
      // Parse date only, set to midnight local time
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
