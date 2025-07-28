import { authApi } from "@/lib/api/auth"
import { useAuthStore } from "@/stores/authStore"
import { toast } from "sonner"

export async function login(username: string, password: string): Promise<void> {
  try {
    const response = await authApi.login({ username, password })
    const { login: storeLogin } = useAuthStore.getState()
    storeLogin(response.session_id, response.user_id)
    toast.success("Login successful")
    // Navigate to home after successful login
    window.location.href = "/"
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    toast.error(message)
    // Don't throw - error is handled with toast
  }
}

export function logout(): void {
  const { logout: storeLogout } = useAuthStore.getState()
  storeLogout()
  window.location.href = "/login"
}

// Handle 401 errors globally
export function handleUnauthorized(): void {
  // Only handle if not already on login page
  if (window.location.pathname !== "/login") {
    logout()
  }
}
