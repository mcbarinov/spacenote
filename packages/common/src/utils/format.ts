/** Formats date to YYYY-MM-DD HH:MM */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${String(year)}-${month}-${day} ${hours}:${minutes}`
}

/** Formats bytes to human-readable size (B, KB, MB) */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
