/**
 * Initializes retry behavior for images in Liquid templates.
 * Call after template HTML is rendered to the DOM.
 *
 * Images must use data-retry-src instead of src:
 * <img data-retry-src="/api/v1/..." class="Image" alt="" />
 *
 * CSS handles loading state via .Image class (gray pulsing background).
 * This function adds .Image--loaded on success or .Image--error on failure.
 *
 * Returns a cleanup function that cancels all pending retries.
 */
export function initImageRetry(container: HTMLElement): () => void {
  const images = container.querySelectorAll<HTMLImageElement>("img[data-retry-src]")
  const timeoutIds = new Set<number>()

  images.forEach((img) => {
    const originalSrc = img.getAttribute("data-retry-src")
    if (!originalSrc) return

    // Skip if already processed
    if (img.classList.contains("Image--loaded") || img.classList.contains("Image--error")) {
      return
    }

    let retryCount = 0
    const maxRetries = 20
    const initialDelay = 500
    const maxDelay = 5000

    const showError = () => {
      img.classList.add("Image--error")
    }

    const showImage = () => {
      if (!document.contains(img)) return
      img.src = `${originalSrc}?_=${String(Date.now())}`
      img.classList.add("Image--loaded")
    }

    const checkImage = async () => {
      try {
        const response = await fetch(originalSrc, { method: "GET" })

        // Check 202 first - it's technically "ok" (2xx) but means still processing
        if (response.status === 202 && retryCount < maxRetries) {
          const delay = Math.min(initialDelay * 1.5 ** retryCount, maxDelay)
          retryCount++
          const timeoutId = window.setTimeout(() => {
            timeoutIds.delete(timeoutId)
            void checkImage()
          }, delay)
          timeoutIds.add(timeoutId)
          return
        }

        if (response.ok) {
          showImage()
          return
        }

        showError()
      } catch {
        showError()
      }
    }

    void checkImage()
  })

  return () => {
    timeoutIds.forEach((id) => {
      clearTimeout(id)
    })
    timeoutIds.clear()
  }
}
