import ky from "ky"
import { AppError } from "@/errors/AppError"

/** Configured ky instance for API requests */
export const httpClient = ky.create({
  prefix: "/",
  retry: 0,
  credentials: "include",
  hooks: {
    afterResponse: [
      async ({ response }) => {
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
