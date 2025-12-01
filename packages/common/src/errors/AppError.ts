import { HTTPError } from "ky"

export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server_error"
  | "network_error"
  | "unknown"

export class AppError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, message: string) {
    super(message)
    this.name = "AppError"
    this.code = code
  }

  // ---------- Static helpers ----------

  static codeFromStatus(statusCode: number): ErrorCode {
    switch (statusCode) {
      case 400:
        return "bad_request"
      case 401:
        return "unauthorized"
      case 403:
        return "forbidden"
      case 404:
        return "not_found"
      case 422:
        return "validation"
      default:
        if (statusCode >= 500) {
          return "server_error"
        }
        return "unknown"
    }
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }
    if (error instanceof HTTPError) {
      const code = AppError.codeFromStatus(error.response.status)
      const defaultMessage = `HTTP ${String(error.response.status)} ${error.response.statusText}`
      return new AppError(code, defaultMessage)
    }
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return new AppError("network_error", "Network connection failed")
    }
    if (error instanceof Error) {
      return new AppError("unknown", error.message)
    }
    return new AppError("unknown", "An unexpected error occurred")
  }

  // ---------- Instance helpers ----------
  get title(): string {
    return errorTitleByCode[this.code]
  }
}

// Note: legacy async parseError has been removed in favor of AppError.fromUnknown

export const errorTitleByCode: Record<ErrorCode, string> = {
  bad_request: "Invalid Request",
  unauthorized: "Authentication Required",
  forbidden: "Access Denied",
  not_found: "Not Found",
  validation: "Validation Error",
  server_error: "Server Error",
  network_error: "Network Error",
  unknown: "Error",
}

// Prefer AppError.title instance getter instead of getErrorTitle()
