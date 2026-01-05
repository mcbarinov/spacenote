export type PreviewType = "image" | "text" | null

const BROWSER_NATIVE_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"]

const CONVERTIBLE_IMAGES = ["image/heic", "image/heif", "image/tiff"]

const TEXT_TYPES = [
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "text/markdown",
  "application/json",
  "application/xml",
]

/** Determines if a file can be previewed and what type of preview to use */
export function getPreviewType(mimeType: string): PreviewType {
  if (BROWSER_NATIVE_IMAGES.includes(mimeType) || CONVERTIBLE_IMAGES.includes(mimeType)) {
    return "image"
  }
  if (TEXT_TYPES.includes(mimeType) || mimeType.startsWith("text/")) {
    return "text"
  }
  return null
}

/** Checks if the image format needs WebP conversion for browser display */
export function needsWebpConversion(mimeType: string): boolean {
  return CONVERTIBLE_IMAGES.includes(mimeType)
}

/** Builds the preview URL for an attachment */
export function getPreviewUrl(attachmentNumber: number, mimeType: string): string {
  const base = `/api/v1/attachments/pending/${String(attachmentNumber)}`
  if (needsWebpConversion(mimeType)) {
    return `${base}?format=webp`
  }
  return base
}
