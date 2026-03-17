import { useMemo, useSyncExternalStore } from "react"

interface UseImageWithRetryOptions {
  /** Initial retry delay in ms (default: 500) */
  initialDelay?: number
  /** Maximum retry delay in ms (default: 5000) */
  maxDelay?: number
  /** Maximum number of retries (default: 20) */
  maxRetries?: number
}

interface UseImageWithRetryResult {
  /** Current image src (with cache-busting during retries) */
  src: string
  /** Whether image is still loading/processing */
  isLoading: boolean
  /** Whether image failed after all retries */
  isError: boolean
  /** Retry loading */
  retry: () => void
}

interface ImageState {
  status: "loading" | "ready" | "error"
  cacheBuster: number
  retryCount: number
}

interface ImageLoader {
  getState: () => ImageState
  subscribe: (listener: () => void) => () => void
  retry: () => void
}

/** Creates an image loader that checks 202 responses and retries with exponential backoff */
function createImageLoader(imageUrl: string, initialDelay: number, maxDelay: number, maxRetries: number): ImageLoader {
  let state: ImageState = { status: "loading", cacheBuster: 0, retryCount: 0 }
  const listeners = new Set<() => void>()
  let timeoutId: number | undefined
  let abortController: AbortController | undefined

  const notify = () => {
    listeners.forEach((listener) => {
      listener()
    })
  }

  const cleanup = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    if (abortController) {
      abortController.abort()
      abortController = undefined
    }
  }

  const checkImage = async () => {
    cleanup()
    abortController = new AbortController()

    try {
      // Append timestamp to bypass browser cache on retries (browser may cache 202 responses)
      const url = state.cacheBuster > 0 ? `${imageUrl}?_=${state.cacheBuster}` : imageUrl
      const response = await fetch(url, { method: "GET", signal: abortController.signal })

      if (response.ok) {
        state = { ...state, status: "ready" }
        notify()
        return
      }

      if (response.status === 202 && state.retryCount < maxRetries) {
        const delay = Math.min(initialDelay * 1.5 ** state.retryCount, maxDelay)
        state = { ...state, retryCount: state.retryCount + 1 }
        timeoutId = window.setTimeout(() => {
          state = { ...state, cacheBuster: Date.now() }
          notify()
          void checkImage()
        }, delay)
        return
      }

      state = { ...state, status: "error" }
      notify()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      state = { ...state, status: "error" }
      notify()
    }
  }

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      if (listeners.size === 1) {
        void checkImage()
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          cleanup()
        }
      }
    },
    retry: () => {
      state = { status: "loading", cacheBuster: Date.now(), retryCount: 0 }
      notify()
      void checkImage()
    },
  }
}

/** Hook for loading images with automatic retry on 202 (processing) responses */
export function useImageWithRetry(imageUrl: string, options: UseImageWithRetryOptions = {}): UseImageWithRetryResult {
  const { initialDelay = 500, maxDelay = 5000, maxRetries = 20 } = options

  const loader = useMemo(
    () => createImageLoader(imageUrl, initialDelay, maxDelay, maxRetries),
    [imageUrl, initialDelay, maxDelay, maxRetries]
  )

  const state = useSyncExternalStore(loader.subscribe, loader.getState, loader.getState)

  const src = useMemo(
    () => (state.cacheBuster > 0 ? `${imageUrl}?_=${state.cacheBuster}` : imageUrl),
    [imageUrl, state.cacheBuster]
  )

  return {
    src,
    isLoading: state.status === "loading",
    isError: state.status === "error",
    retry: loader.retry,
  }
}
