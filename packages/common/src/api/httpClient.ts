import ky, { type KyInstance } from "ky"
import { AppError } from "../errors/AppError"

/** Configured ky instance for API requests */
export let httpClient: KyInstance

/** Initializes HTTP client with app-specific config */
export function initHttpClient(clientApp: "admin" | "web") {
  httpClient = ky.create({
    prefixUrl: "/",
    retry: 0,
    credentials: "include",
    headers: { "X-Client-App": clientApp },
    hooks: {
      afterResponse: [
        async (_request, _options, response) => {
          if (!response.ok) {
            // Shape non-OK responses into AppError with best-effort message extraction
            const code = AppError.codeFromStatus(response.status)
            let message = `HTTP ${response.status} ${response.statusText}`
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
