/**
 * Date formatting utilities
 */

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string to format
 * @returns Formatted date string like "January 1, 2024, 12:00 PM"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a date string to a short format
 * @param dateString - ISO date string to format
 * @returns Formatted date string like "Jan 1, 2024, 12:00 PM"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
