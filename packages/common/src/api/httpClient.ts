import ky, { type KyInstance } from "ky"
import { AppError } from "../errors/AppError"

declare global {
  interface Window {
    __SPACENOTE_CONFIG__?: { API_URL: string }
  }
}

function getBaseUrl(): string {
  // Development: use VITE_API_BASE_URL from .env
  if (import.meta.env.DEV) {
    const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
    if (!envUrl) {
      throw new Error("VITE_API_BASE_URL is not defined in .env file")
    }
    return envUrl
  }

  // Production: use runtime config from window.__SPACENOTE_CONFIG__
  const config = window.__SPACENOTE_CONFIG__
  if (!config?.API_URL) {
    throw new Error("API_URL is not configured. Please check runtime-config.js")
  }
  return config.API_URL
}

const baseUrl = getBaseUrl()

/** Configured ky instance for API requests */
export let httpClient: KyInstance

/** Initializes HTTP client with app-specific config */
export function initHttpClient(clientApp: "admin" | "web") {
  httpClient = ky.create({
    prefixUrl: baseUrl,
    retry: 0,
    credentials: "include",
    headers: { "X-Client-App": clientApp },
    hooks: {
      afterResponse: [
        async (_request, _options, response) => {
          if (!response.ok) {
            // Shape non-OK responses into AppError with best-effort message extraction
            const code = AppError.codeFromStatus(response.status)
            let message = `HTTP ${String(response.status)} ${response.statusText}`
            try {
              const contentType = response.headers.get("content-type")
              if (contentType?.includes("application/json")) {
                const data = (await response.clone().json()) as Record<string, unknown>
                // Check both 'detail' (FastAPI standard) and 'message' fields
                if (typeof data.detail === "string" && data.detail.trim() !== "") {
                  message = data.detail
                } else if (typeof data.message === "string" && data.message.trim() !== "") {
                  message = data.message
                }
              }
            } catch {
              // Ignore parsing errors and use fallback message
            }
            throw new AppError(code, message)
          }

          return response
        },
      ],
    },
  })
}
