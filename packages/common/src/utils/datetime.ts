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
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0")
  const day = String(localDate.getUTCDate()).padStart(2, "0")
  const hours = String(localDate.getUTCHours()).padStart(2, "0")
  const minutes = String(localDate.getUTCMinutes()).padStart(2, "0")
  const seconds = String(localDate.getUTCSeconds()).padStart(2, "0")

  return `${String(year)}-${month}-${day}T${hours}:${minutes}:${seconds}`
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
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")

  return `${String(year)}-${month}-${day}T${hours}:${minutes}:${seconds}`
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
  return `UTC${sign}${String(offsetHours)}`
}
