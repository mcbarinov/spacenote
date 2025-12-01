/** Formats date to locale string */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString()
}

/** Formats bytes to human-readable size (B, KB, MB) */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
