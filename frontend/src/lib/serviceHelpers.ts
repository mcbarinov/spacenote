import { toast } from "sonner"
import { handleUnauthorized } from "@/services/authService"

// Type guard for HTTP errors with response
export function isHttpError(error: unknown): error is { response: { status: number } } {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    error.response !== null &&
    typeof error.response === "object" &&
    "status" in error.response
  )
}

// Helper function to reduce repetitive try-catch-toast pattern
export async function executeWithToast<T>(
  operation: () => Promise<T>,
  successMessage: string,
  errorMessage: string
): Promise<T | null> {
  try {
    const result = await operation()
    toast.success(successMessage)
    return result
  } catch (error) {
    // Check for 401 Unauthorized
    if (isHttpError(error) && error.response.status === 401) {
      handleUnauthorized()
      return null
    }

    const message = error instanceof Error ? error.message : errorMessage
    toast.error(message)
    return null
  }
}

// Version that doesn't throw for void operations
export async function executeWithToastVoid(
  operation: () => Promise<void>,
  successMessage: string,
  errorMessage: string
): Promise<void> {
  try {
    await operation()
    toast.success(successMessage)
  } catch (error) {
    // Check for 401 Unauthorized
    if (isHttpError(error) && error.response.status === 401) {
      handleUnauthorized()
      return
    }

    const message = error instanceof Error ? error.message : errorMessage
    toast.error(message)
  }
}
