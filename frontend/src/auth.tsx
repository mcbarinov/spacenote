import * as React from "react"

import { api } from "@/lib/api"
import { getStoredSessionId, getStoredUser, clearAuthData, setStoredSessionId, setStoredUser } from "@/lib/auth-storage"
import type { User } from "@/types"

export interface AuthContext {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  user: User | null
}

export interface AuthUserContext {
  user: User
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => {
    // Validate both sessionId and user data exist
    const sessionId = getStoredSessionId()
    const storedUser = getStoredUser()

    // If either is missing, clear all auth data and force re-login
    if (!sessionId || !storedUser) {
      clearAuthData()
      return null
    }

    return storedUser
  })
  const isAuthenticated = !!user

  const logout = React.useCallback(async () => {
    try {
      await api.logout()
    } catch (error) {
      // Even if logout API fails, we should clear local auth data
      console.error("Logout API failed:", error)
    }
    clearAuthData()
    setUser(null)
    // Emit logout event for navigation
    window.dispatchEvent(new CustomEvent("auth:logout"))
    // Redirect to login page
    window.location.href = "/login"
  }, [])

  const login = React.useCallback(async (username: string, password: string) => {
    const response = await api.login({ username, password })
    // Handle storage after successful API call
    setStoredSessionId(response.session_id)
    const user: User = {
      id: response.user_id,
      username: response.user_id,
      role: "user", // Default role, backend should provide this in the future
    }
    setStoredUser(user)
    setUser(user)
  }, [])

  // Listen for automatic logout events from API client
  React.useEffect(() => {
    const handleAutoLogout = () => {
      setUser(null)
    }

    window.addEventListener("auth:logout", handleAutoLogout)
    return () => window.removeEventListener("auth:logout", handleAutoLogout)
  }, [])

  const value = React.useMemo(() => ({ isAuthenticated, user, login, logout }), [isAuthenticated, user, login, logout])

  return <AuthContext value={value}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = React.use(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Hook for protected routes - guarantees user is not null
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthUser(): AuthUserContext {
  const context = React.use(AuthContext)
  if (!context) {
    throw new Error("useAuthUser must be used within an AuthProvider")
  }
  if (!context.user) {
    throw new Error("useAuthUser can only be used in authenticated routes")
  }
  
  return {
    user: context.user,
    logout: context.logout,
  }
}
